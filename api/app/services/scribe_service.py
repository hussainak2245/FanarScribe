"""
Pipeline B — Fanar-S-1-7B for all LLM steps, Fanar-Aura-STT-LF-1 for speech.

Steps in order:
  1. STT          — Fanar-Aura-STT-LF-1 → transcript (Groq Whisper as last-resort fallback)
  2. Check        — Fanar-S-1-7B → uncertain_words[] (with partial JSON recovery for >900 KB files)
  3. SOAP+logprobs — Fanar-S-1-7B with logprobs=True → SOAP note + token confidence
  4. Eval         — Fanar-S-1-7B → 5-dimension self-score (receives logprob_data)
  5. Judge        — Fanar-S-1-7B → final verdict + physician questions (3-signal synthesis)
  6. Q-eval       — Fanar-S-1-7B → physician question quality score (0-8)

Escalation rule (from research): normalised_score < 0.65 → mandatory physician review.
Moroccan dialect and mixed-dialect consultations always trigger mandatory review.
Files >900 KB use partial JSON recovery in step 2; response includes partial_check=True.

No Groq LLM calls in this pipeline.
"""
import json
import re
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import UploadFile

from app.core.json_utils import extract_json_object
from app.core.pipeline import PipelineLog, PipelineStep
from app.mock.sample_response import build_mock_response
from app.prompts import (
    build_check_prompt,
    build_eval_prompt,
    build_judge_prompt,
    build_prompt_response_prompt,
    build_qeval_prompt,
    build_soap_prompt,
)
from app.services.fanar_service import LOGPROB_THRESHOLD, FanarService
from app.services.fanar_stt_service import FanarSTTService
from app.services.groq_service import GroqService
from app.services.privacy_service import PrivacyService
from app.services.transcription_service import TranscriptionService
from app.services.uncertainty_service import UncertaintyService

# Files above this size get partial JSON recovery on the check step
_LARGE_FILE_BYTES = 900 * 1024

# Dialects that always require mandatory physician review regardless of score
_MANDATORY_REVIEW_DIALECTS = {"moroccan", "darija", "مغربي", "مغربية"}

# Escalation threshold from research experiment
_ESCALATION_THRESHOLD = 0.65


_PROMPT_RESPONSE_ENDPOINT = "/api/v1/scribe/prompt-response"


class ScribeService:
    def __init__(self) -> None:
        self.fanar_stt = FanarSTTService()
        self.fanar = FanarService()
        self.groq_stt = TranscriptionService()   # Groq Whisper — STT last resort only
        self.groq_service = GroqService()         # kept for prompt-response fallback only
        self.uncertainty_service = UncertaintyService()
        self.privacy_service = PrivacyService()

    # ══════════════════════════════════════════════════════════════════════════
    # Public API
    # ══════════════════════════════════════════════════════════════════════════

    async def process(
        self,
        audio_file: Optional[UploadFile],
        patient_record_number: str,
        encounter_id: str,
        consultation_time: str,
        doctor_id: Optional[str],
        language_hint: str,
        dialect_hint: str,
        note_format: str,
        privacy_mode: str,
        source_mode: str,
        patient_context_json: Optional[str],
        manual_transcript: Optional[str],
        mixed_dialect: bool = False,
    ) -> Dict[str, Any]:
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        pipeline = PipelineLog()
        warnings: list[str] = []
        partial_check = False

        # ── Step 1: STT ───────────────────────────────────────────────────────
        transcription_result = await self._run_stt(
            audio_file, source_mode, manual_transcript, pipeline, warnings
        )
        transcript = transcription_result["text"]
        file_size = transcription_result["audio"].get("size_bytes", 0) if source_mode == "audio" else 0

        # ── Step 2: Check (uncertain words) ──────────────────────────────────
        uncertain_words, partial_check = self._run_check(
            transcript, dialect_hint, file_size, pipeline, warnings
        )

        # ── Step 3: SOAP + logprobs ───────────────────────────────────────────
        soap_note, claims, logprob_data = self._run_soap(
            transcript, uncertain_words, patient_context_json,
            patient_record_number, encounter_id, consultation_time,
            note_format, pipeline, warnings
        )

        # ── Step 4: Eval ──────────────────────────────────────────────────────
        self_eval = self._run_eval(transcript, soap_note, claims, logprob_data, pipeline, warnings)

        # ── Step 5: Judge → final uncertainty + physician questions ───────────
        uncertainty, physician_questions = self._run_judge(
            transcript, soap_note, self_eval, logprob_data, uncertain_words, pipeline, warnings
        )
        self._merge_claim_evaluations(claims, uncertainty.get("claim_evaluations", []))

        # ── Step 6: Q-eval ───────────────────────────────────────────────────
        qeval = self._run_qeval(physician_questions, transcript, soap_note, pipeline, warnings)

        # ── Rule-based stabilisation ──────────────────────────────────────────
        structured: Dict[str, Any] = {
            "translation": {"target_language": "en", "clinical_translation": transcript,
                            "normalized_clinical_meaning": []},
            "uncertain_words": uncertain_words,
            "soap_note": soap_note,
            "claims": claims,
            "uncertainty": uncertainty,
            "physician_questions": physician_questions,
        }
        self._apply_transcription_metadata(structured, transcription_result, dialect_hint)
        structured = self.uncertainty_service.stabilize(structured, transcript, dialect_hint)

        # ── Escalation logic ──────────────────────────────────────────────────
        score = logprob_data.get("normalised_score")
        mandatory_review = (
            dialect_hint.lower() in _MANDATORY_REVIEW_DIALECTS
            or mixed_dialect
            or (score is not None and score < _ESCALATION_THRESHOLD)
            or logprob_data.get("below_threshold", False)
        )

        # ── UI layer ──────────────────────────────────────────────────────────
        physician_prompts = self._build_physician_prompts(
            structured.get("physician_questions", [])
        )
        note_actions = self._build_note_actions(structured, transcript)

        pipeline_dict = pipeline.to_dict()
        return {
            "request_id": request_id,
            "status": "completed",
            "patient_record_number": patient_record_number,
            "encounter_id": encounter_id,
            "consultation_time": consultation_time,
            "source_mode": source_mode,
            # Pipeline B provenance
            "pipeline_version": "B",
            "models_used": {
                "transcription":   {"provider": transcription_result["provider"], "model": transcription_result["model"]},
                "check":           {"provider": "fanar", "model": self.fanar.model},
                "soap_generation": {"provider": "fanar", "model": self.fanar.model},
                "eval":            {"provider": "fanar", "model": self.fanar.model},
                "judge":           {"provider": "fanar", "model": self.fanar.model},
                "qeval":           {"provider": "fanar", "model": self.fanar.model},
            },
            "providers_used": {
                "transcription": transcription_result["provider"],
                "llm": "fanar",
                "fallback_used": any(
                    "fallback" in w.lower() for w in warnings
                ),
            },
            "pipeline": pipeline_dict,
            "inference": {
                "total_ms": pipeline_dict["total_ms"],
                "breakdown_ms": {s["step"]: s["duration_ms"] for s in pipeline_dict["steps"]},
                "timing_source": "server_perf_counter",
            },
            "audio": transcription_result["audio"],
            "speaker_context": {
                "expected_speakers": ["doctor", "patient"],
                "supported_speaker_labels": ["doctor", "patient", "unknown"],
                "diarization_status": transcription_result["audio"].get("diarization_status"),
            },
            **structured,
            # Pipeline B–specific outputs
            "logprob_data": logprob_data,
            "self_eval": self_eval,
            "question_eval": qeval,
            "mandatory_review": mandatory_review,
            "partial_check": partial_check,
            "physician_prompts": physician_prompts,
            "note_actions": note_actions,
            "prompt_followup": {
                "mode": "stateless_chat",
                "endpoint": _PROMPT_RESPONSE_ENDPOINT,
                "supported_prompt_types": ["mcq", "short_answer", "buttons"],
            },
            "privacy": self.privacy_service.build_privacy_metadata(privacy_mode),
            "frontend_hints": self._build_frontend_hints(mandatory_review, logprob_data),
            "warnings": warnings,
        }

    def respond_to_prompt(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        started = time.perf_counter()
        prompt = build_prompt_response_prompt(
            {"id": payload["prompt_id"], "prompt_type": payload["prompt_type"],
             "question": payload["question"]},
            payload["answer"],
            payload.get("scribe_context"),
            payload.get("conversation_history", []),
        )
        warnings: list[str] = []
        provider = "fanar"
        model = self.fanar.model
        input_tokens = output_tokens = None

        try:
            result = self.fanar.chat_with_usage(prompt, temperature=0.2)
            parsed = extract_json_object(result["text"])
            input_tokens = result["input_tokens"]
            output_tokens = result["output_tokens"]
        except Exception as fanar_err:
            warnings.append(f"Fanar prompt-response failed: {fanar_err}")
            try:
                result = self.groq_service.chat_with_usage(prompt, temperature=0.2, max_tokens=1200)
                parsed = extract_json_object(result["text"])
                provider = "groq"
                model = self.groq_service.settings.groq_llm_model
                input_tokens = result["input_tokens"]
                output_tokens = result["output_tokens"]
            except Exception as groq_err:
                warnings.append(f"Groq fallback failed: {groq_err}")
                parsed = self._build_local_prompt_response(payload)
                provider = "local"
                model = "local_fallback"

        total_ms = round((time.perf_counter() - started) * 1000, 2)
        return {
            "request_id": payload["request_id"],
            "prompt_id": payload["prompt_id"],
            "status": "answered",
            "answer_received": payload["answer"],
            "assistant_message": parsed.get("assistant_message", ""),
            "note_update_suggestion": parsed.get("note_update_suggestion", {"operation": "none"}),
            "claim_update_suggestion": parsed.get("claim_update_suggestion", {"status": "none"}),
            "next_prompts": parsed.get("next_prompts", []),
            "pipeline": {
                "total_ms": total_ms,
                "fanar_calls": 1 if provider == "fanar" else 0,
                "fallback_calls": 0 if provider == "fanar" else 1,
                "steps": [{"step": "prompt_response", "provider": provider, "model": model,
                           "status": "completed", "duration_ms": total_ms,
                           "input_tokens": input_tokens, "output_tokens": output_tokens,
                           "fallback": provider != "fanar"}],
            },
            "warnings": warnings,
        }

    # ══════════════════════════════════════════════════════════════════════════
    # Pipeline steps
    # ══════════════════════════════════════════════════════════════════════════

    async def _run_stt(
        self,
        audio_file: Optional[UploadFile],
        source_mode: str,
        manual_transcript: Optional[str],
        pipeline: PipelineLog,
        warnings: list,
    ) -> Dict[str, Any]:
        if source_mode == "manual_transcript":
            if not manual_transcript:
                raise ValueError("manual_transcript required when source_mode is manual_transcript")
            step = pipeline.start_step("transcription", "manual", "manual_transcript")
            step.finish()
            return {
                "text": manual_transcript,
                "provider": "manual",
                "model": "manual_transcript",
                "duration_ms": 0,
                "audio": {"filename": None, "content_type": None, "size_bytes": 0,
                          "source_mode": "manual_transcript",
                          "expected_speakers": ["doctor", "patient"],
                          "diarization_status": "not_applicable_manual_transcript"},
                "segments": [{"id": "seg_001", "speaker": "unknown", "start": None,
                              "end": None, "text": manual_transcript, "confidence": None}],
            }

        if source_mode != "audio":
            raise ValueError("source_mode must be 'audio' or 'manual_transcript'")
        if not audio_file:
            raise ValueError("audio_file required when source_mode is audio")

        # Try Fanar STT first
        step = pipeline.start_step("transcription", "fanar_stt", self.fanar_stt.settings.fanar_stt_model)
        try:
            result = await self.fanar_stt.transcribe(audio_file)
            step.finish()
            return result
        except Exception as fanar_err:
            fanar_error = str(fanar_err)
            step.finish(error=fanar_error)
            warnings.append(f"Fanar STT failed — falling back to Groq Whisper: {fanar_error}")

        # Groq Whisper last resort
        step_fb = pipeline.start_step("transcription_fallback", "groq_whisper",
                                       self.groq_stt.settings.groq_asr_model)
        step_fb.fallback = True
        try:
            result = await self.groq_stt.transcribe_audio(audio_file)
            step_fb.finish()
            return result
        except Exception as groq_err:
            step_fb.finish(error=str(groq_err))
            raise RuntimeError(f"All STT providers failed — Fanar: {fanar_error}; Groq: {groq_err}") from groq_err

    def _run_check(
        self,
        transcript: str,
        dialect_hint: str,
        file_size: int,
        pipeline: PipelineLog,
        warnings: list,
    ) -> Tuple[List[Dict[str, Any]], bool]:
        """Returns (uncertain_words, partial_check)."""
        step = pipeline.start_step("check", "fanar", self.fanar.model)
        try:
            result = self.fanar.chat_with_usage(build_check_prompt(transcript, dialect_hint))
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()

            is_large = file_size > _LARGE_FILE_BYTES
            words, partial = _extract_uncertain_words(result["text"], attempt_partial=is_large)
            if partial:
                warnings.append(
                    f"check step: partial JSON recovery used (file_size={file_size} bytes)"
                )
            return words, partial
        except Exception as err:
            step.finish(error=str(err))
            warnings.append(f"check step failed: {err}")
            return [], False

    def _run_soap(
        self,
        transcript: str,
        uncertain_words: List[Dict[str, Any]],
        patient_context_json: Optional[str],
        patient_record_number: str,
        encounter_id: str,
        consultation_time: str,
        note_format: str,
        pipeline: PipelineLog,
        warnings: list,
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Any]]:
        """Returns (soap_note, claims, logprob_data)."""
        uncertain_summary = ", ".join(w.get("text", "") for w in uncertain_words[:5]) or "none detected"
        prompt = build_soap_prompt(
            transcript=transcript,
            clinical_translation=transcript,   # Pipeline B: no separate translation step
            uncertain_words_summary=uncertain_summary,
            patient_context=patient_context_json,
            patient_record_number=patient_record_number,
            encounter_id=encounter_id,
            consultation_time=consultation_time,
            note_format=note_format,
        )

        step = pipeline.start_step("soap_generation", "fanar", self.fanar.model)
        try:
            result = self.fanar.chat_with_logprobs(prompt)
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()

            parsed = extract_json_object(result["text"])
            soap_note = parsed.get("soap_note") or self._default_soap()
            claims: list = parsed.get("claims") or []
            logprob_data: dict = result["logprob_data"]

            if logprob_data.get("normalised_score") is None:
                warnings.append(
                    "logprobs not returned by Fanar API — "
                    "normalised_score will be None. Confirm Fanar supports logprobs=True."
                )
            return soap_note, claims, logprob_data
        except Exception as err:
            step.finish(error=str(err))
            warnings.append(f"SOAP generation failed: {err}")
            mock = build_mock_response(transcript, "gulf")
            return mock["soap_note"], mock.get("claims", []), {
                "avg_logprob": None, "normalised_score": None,
                "below_threshold": False, "token_count": 0, "top_uncertain_tokens": [],
            }

    def _run_eval(
        self,
        transcript: str,
        soap_note: Dict[str, Any],
        claims: List[Dict[str, Any]],
        logprob_data: Dict[str, Any],
        pipeline: PipelineLog,
        warnings: list,
    ) -> Dict[str, Any]:
        step = pipeline.start_step("eval", "fanar", self.fanar.model)
        try:
            result = self.fanar.chat_with_usage(
                build_eval_prompt(transcript, soap_note, claims, logprob_data)
            )
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()
            parsed = extract_json_object(result["text"])
            return parsed.get("self_eval") or self._default_eval()
        except Exception as err:
            step.finish(error=str(err))
            warnings.append(f"eval step failed: {err}")
            return self._default_eval()

    def _run_judge(
        self,
        transcript: str,
        soap_note: Dict[str, Any],
        self_eval: Dict[str, Any],
        logprob_data: Dict[str, Any],
        uncertain_words: List[Dict[str, Any]],
        pipeline: PipelineLog,
        warnings: list,
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Returns (uncertainty, physician_questions)."""
        step = pipeline.start_step("judge", "fanar", self.fanar.model)
        try:
            result = self.fanar.chat_with_usage(
                build_judge_prompt(transcript, soap_note, self_eval, logprob_data, uncertain_words)
            )
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()
            parsed = extract_json_object(result["text"])
            uncertainty = parsed.get("uncertainty") or self._default_uncertainty()
            questions: list = parsed.get("physician_questions") or []
            return uncertainty, questions
        except Exception as err:
            step.finish(error=str(err))
            warnings.append(f"judge step failed: {err}")
            return self._default_uncertainty(), []

    def _run_qeval(
        self,
        physician_questions: List[Dict[str, Any]],
        transcript: str,
        soap_note: Dict[str, Any],
        pipeline: PipelineLog,
        warnings: list,
    ) -> Dict[str, Any]:
        if not physician_questions:
            return {"overall_score": 0, "overall_grade": "weak", "question_scores": []}
        step = pipeline.start_step("qeval", "fanar", self.fanar.model)
        try:
            result = self.fanar.chat_with_usage(
                build_qeval_prompt(physician_questions, transcript, soap_note)
            )
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()
            return extract_json_object(result["text"])
        except Exception as err:
            step.finish(error=str(err))
            warnings.append(f"qeval step failed: {err}")
            return {"overall_score": 0, "overall_grade": "weak", "question_scores": []}

    def _merge_claim_evaluations(
        self, claims: list, evaluations: list
    ) -> None:
        ev_map = {ev.get("claim_id"): ev for ev in evaluations if ev.get("claim_id")}
        for claim in claims:
            ev = ev_map.get(claim.get("id"))
            if ev:
                claim["evidence_level"] = ev.get("evidence_level", claim.get("level"))
                claim["evidence_note"] = ev.get("note", "")

    def _apply_transcription_metadata(
        self, structured: Dict[str, Any], transcription_result: Dict[str, Any], dialect_hint: str
    ) -> None:
        transcription = structured.setdefault("transcription", {})
        transcription.setdefault("language_detected", "ar")
        transcription.setdefault("dialect_hint", dialect_hint)
        transcription.setdefault("raw_text", transcription_result["text"])
        transcription.setdefault("cleaned_text", transcription_result["text"])
        if not transcription.get("segments"):
            transcription["segments"] = transcription_result["segments"]
        for idx, segment in enumerate(transcription.get("segments", []), start=1):
            segment.setdefault("id", f"seg_{idx:03d}")
            if segment.get("speaker") not in {"doctor", "patient", "unknown"}:
                segment["speaker"] = "unknown"
            segment.setdefault("start", None)
            segment.setdefault("end", None)
            segment.setdefault("confidence", None)

    def _build_physician_prompts(self, questions: list) -> list:
        prompts = []
        for question in questions:
            prompt_type = self._question_to_prompt_type(question.get("type", "free_text"))
            prompts.append({
                "id": f"prompt_{question.get('id', len(prompts) + 1)}",
                "source_question_id": question.get("id"),
                "prompt_type": prompt_type,
                "priority": question.get("priority", "medium"),
                "title": question.get("title", "Physician clarification"),
                "question": question.get("question", ""),
                "reason": question.get("reason", ""),
                "required": question.get("priority") == "high",
                "ui": self._build_prompt_ui(prompt_type, question),
                "response_field": "answer",
                "endpoint": _PROMPT_RESPONSE_ENDPOINT,
            })
        if not any(p["prompt_type"] == "short_answer" for p in prompts):
            prompts.append({
                "id": "prompt_extra_clarification",
                "source_question_id": None,
                "prompt_type": "short_answer",
                "priority": "medium",
                "title": "Additional clarification",
                "question": "Add any short clinical clarification that should be reflected in the note.",
                "reason": "Allows the physician to provide free-text context beyond the generated choices.",
                "required": False,
                "ui": {"component": "text_input", "multiline": True,
                       "placeholder": "Type a short clarification"},
                "response_field": "text",
                "endpoint": _PROMPT_RESPONSE_ENDPOINT,
            })
        prompts.append({
            "id": "prompt_finalize_note",
            "source_question_id": None,
            "prompt_type": "buttons",
            "priority": "medium",
            "title": "Note handling",
            "question": "How should this draft note move forward?",
            "reason": "Explicit action buttons after review.",
            "required": False,
            "ui": {
                "component": "button_group",
                "buttons": [
                    {"label": "Keep reviewing",   "value": "keep_reviewing",   "variant": "secondary"},
                    {"label": "Mark ready later", "value": "mark_ready_later", "variant": "primary"},
                ],
            },
            "response_field": "selected_button",
            "endpoint": _PROMPT_RESPONSE_ENDPOINT,
        })
        return prompts

    def _question_to_prompt_type(self, question_type: str) -> str:
        if question_type in {"single_choice", "multiple_choice", "yes_no"}:
            return "mcq"
        if question_type == "confirm_reject":
            return "buttons"
        return "short_answer"

    def _build_prompt_ui(self, prompt_type: str, question: Dict[str, Any]) -> Dict[str, Any]:
        if prompt_type == "mcq":
            return {"component": "choice_list",
                    "allow_multiple": question.get("type") == "multiple_choice",
                    "options": question.get("options", [])}
        if prompt_type == "buttons":
            return {"component": "button_group", "buttons": question.get("options", [])}
        return {"component": "text_input", "multiline": True,
                "placeholder": "Type a short clinical clarification"}

    def _build_note_actions(self, structured: Dict[str, Any], transcript: str) -> list:
        actions = []
        lower = transcript.lower()
        if any(t in lower for t in ["كتمة", "ضيقة", "shortness", "breath", "chest"]):
            actions.append(self._note_action(
                "illness_pattern_review", "Illness pattern review",
                "Draft likely illness-pattern checks from symptoms and uncertain claims.",
                recommended=True,
            ))
        mandatory = structured.get("mandatory_review", False)
        if mandatory or not actions:
            actions.append(self._note_action(
                "clinical_gap_scan", "Clinical gap scan",
                "Check missing allergy, medication, red flag, and follow-up details.",
                recommended=True,
            ))
        return actions[:2]

    def _note_action(self, action_id: str, label: str, description: str, *, recommended: bool) -> dict:
        return {
            "id": action_id, "label": label, "description": description,
            "kind": "ml_prediction", "state": "under_development", "recommended": recommended,
            "ui": {"component": "button", "label": label, "disabled": False,
                   "response_message": "Under development"},
        }

    def _build_frontend_hints(self, mandatory_review: bool, logprob_data: Dict[str, Any]) -> dict:
        score = logprob_data.get("normalised_score")
        low_confidence = logprob_data.get("below_threshold", False) or (
            score is not None and score < _ESCALATION_THRESHOLD
        )
        return {
            "highlight_segments": True,
            "show_uncertainty_panel": True,
            "requires_physician_review": mandatory_review,
            "can_finalize": not mandatory_review,
            "mandatory_review": mandatory_review,
            "low_confidence_warning": low_confidence,
            "logprob_score": score,
            "uncertainty_rendering": {
                "source_field": "uncertainty_spans",
                "interaction": "underline_transcript_text",
            },
            "tabs": [
                {"id": "overview",    "label": "Overview",    "status": "ready"},
                {"id": "transcript",  "label": "Transcript",  "status": "ready"},
                {"id": "soap",        "label": "SOAP",        "status": "ready"},
                {"id": "uncertainty", "label": "Uncertainty", "status": "ready"},
                {"id": "prompts",     "label": "Prompts",     "status": "ready"},
            ],
        }

    def _build_local_prompt_response(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "assistant_message": "Answer received. Marked for review in the draft note.",
            "note_update_suggestion": {
                "section": "plan.recommended_clarifications",
                "operation": "append",
                "text": str(payload.get("answer", {})),
            },
            "claim_update_suggestion": {"claim_id": None, "status": "needs_review",
                                        "reason": "Local fallback."},
            "next_prompts": [],
        }

    def _default_soap(self) -> dict:
        return {
            "overall_quality_level": "needs_review",
            "subjective":  {"chief_complaint": "", "history_of_present_illness": [],
                            "associated_symptoms": [], "negative_symptoms": [], "patient_words": []},
            "objective":   {"vitals": [], "exam_findings": [], "available_data": []},
            "assessment":  {"summary": "", "possible_issues": [], "unsupported_or_inferred": []},
            "plan":        {"recommended_clarifications": [], "patient_instructions_draft": []},
        }

    def _default_eval(self) -> dict:
        return {
            "overall_score": 0.50,
            "overall_level": "needs_review",
            "dimensions": {
                "transcription_quality": {"score": 0.60, "level": "needs_review", "note": ""},
                "dialect_coverage":     {"score": 0.55, "level": "needs_review", "note": ""},
                "clinical_extraction":  {"score": 0.55, "level": "needs_review", "note": ""},
                "evidence_support":     {"score": 0.50, "level": "needs_review", "note": ""},
                "completeness":         {"score": 0.45, "level": "poor",         "note": ""},
            },
            "summary": "Self-eval unavailable — physician review recommended.",
        }

    def _default_uncertainty(self) -> dict:
        return {
            "overall_score": 0.55,
            "overall_level": "needs_review",
            "overall_label": "Needs review",
            "summary": "Physician review required.",
            "claim_evaluations": [],
            "dimensions": {
                "transcription_quality": {"score": 0.70, "level": "good"},
                "translation_quality":   {"score": 0.60, "level": "needs_review"},
                "clinical_extraction":   {"score": 0.60, "level": "needs_review"},
                "evidence_support":      {"score": 0.55, "level": "needs_review"},
                "clinical_completeness": {"score": 0.45, "level": "poor"},
            },
        }


# ── Partial JSON recovery for the check step ──────────────────────────────────

def _extract_uncertain_words(
    raw_text: str, attempt_partial: bool = False
) -> Tuple[List[Dict[str, Any]], bool]:
    """
    Parse uncertain_words from the check step response.
    Returns (words, is_partial).

    If full parse fails and attempt_partial is True (large files), walks the
    raw string to extract every complete JSON object that contains a 'text' key.
    Research finding: haytham_rafoush_71 (1114 KB, two-dialect) truncated here.
    """
    try:
        parsed = extract_json_object(raw_text)
        return parsed.get("uncertain_words", []), False
    except Exception:
        pass

    if not attempt_partial:
        return [], False

    words = _walk_partial_uncertain_words(raw_text)
    return words, True


def _walk_partial_uncertain_words(raw_text: str) -> List[Dict[str, Any]]:
    """Walk raw_text to extract complete JSON objects from a truncated uncertain_words array."""
    arr_start = raw_text.find('"uncertain_words"')
    if arr_start == -1:
        return []
    arr_bracket = raw_text.find("[", arr_start)
    if arr_bracket == -1:
        return []
    return _collect_objects_in_array(raw_text, arr_bracket + 1)


def _collect_objects_in_array(text: str, start: int) -> List[Dict[str, Any]]:
    """Extract every balanced JSON object from text[start:] until ']' at depth 0."""
    words: List[Dict[str, Any]] = []
    i = start
    depth = 0
    obj_start: Optional[int] = None

    while i < len(text):
        c = text[i]
        if c == "{":
            if depth == 0:
                obj_start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and obj_start is not None:
                _try_append_object(text, obj_start, i, words)
                obj_start = None
        elif c == "]" and depth == 0:
            break
        i += 1

    return words


def _try_append_object(
    text: str, start: int, end: int, words: List[Dict[str, Any]]
) -> None:
    try:
        obj = json.loads(text[start : end + 1])
        if "text" in obj:
            words.append(obj)
    except json.JSONDecodeError:
        pass
