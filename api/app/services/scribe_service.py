"""
Scribe pipeline orchestrator.

process() runs four sequential steps, each independently timed and tracked:
  1. Transcription      — Groq Whisper ASR (or manual transcript passthrough)
  2. Translation        — Fanar dialect normalisation + clinical translation
  3. SOAP generation    — Fanar structured note + evidence-linked claims
  4. Uncertainty        — Fanar claim-evidence scoring + physician questions

Each LLM step tries Fanar first and falls back to Groq if Fanar fails.
The rule-based UncertaintyService.stabilize() then runs on the assembled
output to add phrase-bank flags, risk weights, and completeness checks.

All timings and token counts are returned in the pipeline[] response field.
"""
import time
import uuid
from typing import Any, Dict, Optional, Tuple

from fastapi import UploadFile

from app.core.json_utils import extract_json_object
from app.core.pipeline import PipelineLog, PipelineStep
from app.mock.sample_response import build_mock_response
from app.prompts import (
    build_prompt_response_prompt,
    build_soap_prompt,
    build_translate_prompt,
    build_uncertainty_prompt,
)
from app.services.fanar_service import FanarService
from app.services.groq_service import GroqService
from app.services.privacy_service import PrivacyService
from app.services.transcription_service import TranscriptionService
from app.services.uncertainty_service import UncertaintyService


class ScribeService:
    def __init__(self) -> None:
        self.transcription_service = TranscriptionService()
        self.fanar_service = FanarService()
        self.groq_service = GroqService()
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
    ) -> Dict[str, Any]:
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        pipeline = PipelineLog()
        warnings: list[str] = []

        # ── Step 1: Transcription ──────────────────────────────────────────
        if source_mode == "audio":
            step1 = pipeline.start_step("transcription", "groq_whisper", self.groq_service.settings.groq_asr_model)
        else:
            step1 = pipeline.start_step("transcription", "manual", "manual_transcript")

        try:
            transcription_result = await self._get_transcript(audio_file, source_mode, manual_transcript)
            step1.finish()
        except Exception as err:
            step1.finish(error=str(err))
            raise

        transcript = transcription_result["text"]

        # ── Step 2: Dialect normalisation + clinical translation ───────────
        translate_provider = "fanar"
        try:
            translate_data, translate_provider = self._call_llm_step(
                pipeline,
                "translation",
                build_translate_prompt(transcript, dialect_hint),
            )
            translation = translate_data.get("translation") or self._default_translation(transcript)
            uncertain_words: list[Dict[str, Any]] = translate_data.get("uncertain_words") or []
        except RuntimeError as err:
            warnings.append(str(err))
            translate_provider = "local"
            translation = self._default_translation(transcript)
            uncertain_words = []

        # ── Step 3: SOAP note + evidence-linked claims ────────────────────
        clinical_translation = translation.get("clinical_translation", transcript)
        uncertain_summary = ", ".join(w.get("text", "") for w in uncertain_words[:5]) or "none detected"

        soap_provider = "fanar"
        try:
            soap_data, soap_provider = self._call_llm_step(
                pipeline,
                "soap_generation",
                build_soap_prompt(
                    transcript=transcript,
                    clinical_translation=clinical_translation,
                    uncertain_words_summary=uncertain_summary,
                    patient_context=patient_context_json,
                    patient_record_number=patient_record_number,
                    encounter_id=encounter_id,
                    consultation_time=consultation_time,
                    note_format=note_format,
                ),
                max_tokens_groq=3500,
            )
            soap_note = soap_data.get("soap_note") or self._default_soap()
            claims: list[Dict[str, Any]] = soap_data.get("claims") or []
        except RuntimeError as err:
            warnings.append(str(err))
            soap_provider = "local"
            mock = build_mock_response(transcript, dialect_hint)
            soap_note = mock["soap_note"]
            claims = mock.get("claims", [])

        # ── Step 4: Claim-evidence scoring + physician questions ──────────
        uncertainty_provider = "fanar"
        try:
            uncertainty_data, uncertainty_provider = self._call_llm_step(
                pipeline,
                "uncertainty",
                build_uncertainty_prompt(
                    transcript=transcript,
                    soap_note=soap_note,
                    claims=claims,
                ),
                max_tokens_groq=2000,
            )
            uncertainty = uncertainty_data.get("uncertainty") or self._default_uncertainty()
            physician_questions: list[Dict[str, Any]] = uncertainty_data.get("physician_questions") or []
            self._merge_claim_evaluations(claims, uncertainty.get("claim_evaluations", []))
        except RuntimeError as err:
            warnings.append(str(err))
            uncertainty_provider = "local"
            uncertainty = self._default_uncertainty()
            physician_questions = []

        # ── Assemble + stabilise ──────────────────────────────────────────
        structured: Dict[str, Any] = {
            "translation": translation,
            "uncertain_words": uncertain_words,
            "soap_note": soap_note,
            "claims": claims,
            "uncertainty": uncertainty,
            "physician_questions": physician_questions,
        }
        self._apply_transcription_metadata(structured, transcription_result, dialect_hint)

        # Rule-based layer: phrase bank, risk weights, checklists, negation
        structured = self.uncertainty_service.stabilize(structured, transcript, dialect_hint)

        # UI layer
        requires_review = structured.get("uncertainty", {}).get("overall_level") not in {"very_good", "good"}
        physician_prompts = self._build_physician_prompts(structured.get("physician_questions", []))
        note_actions = self._build_note_actions(structured, transcript)

        # Provider/model summary for backward compatibility
        providers_used = {
            "transcription": transcription_result["provider"],
            "translation": translate_provider,
            "soap_generation": soap_provider,
            "uncertainty": uncertainty_provider,
            "fallback_used": any(p != "fanar" for p in [translate_provider, soap_provider, uncertainty_provider]),
        }
        models_used = self._build_models_used(transcription_result, translate_provider, soap_provider, uncertainty_provider)
        pipeline_dict = pipeline.to_dict()

        return {
            "request_id": request_id,
            "status": "completed",
            "patient_record_number": patient_record_number,
            "encounter_id": encounter_id,
            "consultation_time": consultation_time,
            "source_mode": source_mode,
            "providers_used": providers_used,
            "models_used": models_used,
            "pipeline": pipeline_dict,
            # Backward-compat inference field
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
                "note": "Speaker labels depend on ASR diarisation quality.",
            },
            **structured,
            "physician_prompts": physician_prompts,
            "note_actions": note_actions,
            "prompt_followup": {
                "mode": "stateless_chat",
                "endpoint": "/api/v1/scribe/prompt-response",
                "supported_prompt_types": ["mcq", "short_answer", "buttons"],
            },
            "privacy": self.privacy_service.build_privacy_metadata(privacy_mode),
            "frontend_hints": self._build_frontend_hints(requires_review),
            "warnings": warnings,
        }

    def respond_to_prompt(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        started = time.perf_counter()
        prompt = build_prompt_response_prompt(
            {"id": payload["prompt_id"], "prompt_type": payload["prompt_type"], "question": payload["question"]},
            payload["answer"],
            payload.get("scribe_context"),
            payload.get("conversation_history", []),
        )
        warnings: list[str] = []
        provider = "fanar"
        model = self.fanar_service.model
        input_tokens = output_tokens = None

        try:
            result = self.fanar_service.chat_with_usage(prompt, temperature=0.2)
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
                "steps": [{
                    "step": "prompt_response",
                    "provider": provider,
                    "model": model,
                    "status": "completed",
                    "duration_ms": total_ms,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "fallback": provider != "fanar",
                }],
            },
            "models_used": {"prompt_response": {"provider": provider, "model": model}},
            "warnings": warnings,
        }

    # ══════════════════════════════════════════════════════════════════════════
    # Private helpers
    # ══════════════════════════════════════════════════════════════════════════

    def _call_llm_step(
        self,
        pipeline: PipelineLog,
        step_name: str,
        prompt: str,
        temperature: float = 0,
        max_tokens_groq: int = 3000,
    ) -> Tuple[Dict[str, Any], str]:
        """
        Try Fanar → fall back to Groq.
        Returns (parsed_json, provider_name).
        Raises RuntimeError if both providers fail.
        """
        step: PipelineStep = pipeline.start_step(step_name, "fanar", self.fanar_service.model)
        fanar_err_msg = ""
        try:
            result = self.fanar_service.chat_with_usage(prompt, temperature=temperature)
            parsed = extract_json_object(result["text"])
            step.input_tokens = result["input_tokens"]
            step.output_tokens = result["output_tokens"]
            step.finish()
            return parsed, "fanar"
        except Exception as fanar_err:
            fanar_err_msg = str(fanar_err)
            step.finish(error=fanar_err_msg)
            step.fallback = True

        # Groq fallback
        step_fb: PipelineStep = pipeline.start_step(
            f"{step_name}_fallback",
            "groq",
            self.groq_service.settings.groq_llm_model,
        )
        step_fb.fallback = True
        try:
            result = self.groq_service.chat_with_usage(prompt, temperature=temperature, max_tokens=max_tokens_groq)
            parsed = extract_json_object(result["text"])
            step_fb.input_tokens = result["input_tokens"]
            step_fb.output_tokens = result["output_tokens"]
            step_fb.finish()
            return parsed, "groq"
        except Exception as groq_err:
            step_fb.finish(error=str(groq_err))
            raise RuntimeError(
                f"Step '{step_name}' failed — Fanar: {fanar_err_msg!r}; Groq: {groq_err!r}"
            ) from groq_err

    def _merge_claim_evaluations(
        self, claims: list[Dict[str, Any]], evaluations: list[Dict[str, Any]]
    ) -> None:
        eval_map = {ev.get("claim_id"): ev for ev in evaluations if ev.get("claim_id")}
        for claim in claims:
            ev = eval_map.get(claim.get("id"))
            if ev:
                claim["evidence_level"] = ev.get("evidence_level", claim.get("level"))
                claim["evidence_note"] = ev.get("note", "")

    async def _get_transcript(
        self,
        audio_file: Optional[UploadFile],
        source_mode: str,
        manual_transcript: Optional[str],
    ) -> Dict[str, Any]:
        if source_mode == "manual_transcript":
            if not manual_transcript:
                raise ValueError("manual_transcript is required when source_mode is manual_transcript")
            return {
                "text": manual_transcript,
                "provider": "manual",
                "model": "manual_transcript",
                "duration_ms": 0,
                "audio": {
                    "filename": None,
                    "content_type": None,
                    "size_bytes": 0,
                    "source_mode": "manual_transcript",
                    "expected_speakers": ["doctor", "patient"],
                    "diarization_status": "not_applicable_manual_transcript",
                },
                "segments": [{
                    "id": "seg_001",
                    "speaker": "unknown",
                    "start": None,
                    "end": None,
                    "text": manual_transcript,
                    "confidence": None,
                }],
            }
        if source_mode == "audio":
            if not audio_file:
                raise ValueError("audio_file is required when source_mode is audio")
            return await self.transcription_service.transcribe_audio(audio_file)
        raise ValueError("source_mode must be 'audio' or 'manual_transcript'")

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

    def _build_models_used(
        self,
        transcription_result: Dict[str, Any],
        translate_provider: str,
        soap_provider: str,
        uncertainty_provider: str,
    ) -> Dict[str, Any]:
        def _model(provider: str) -> str:
            if provider == "fanar":
                return self.fanar_service.model
            if provider == "groq":
                return self.groq_service.settings.groq_llm_model
            return "local_fallback"

        return {
            "transcription":   {"provider": transcription_result["provider"], "model": transcription_result["model"]},
            "translation":     {"provider": translate_provider,  "model": _model(translate_provider)},
            "soap_generation": {"provider": soap_provider,       "model": _model(soap_provider)},
            "uncertainty":     {"provider": uncertainty_provider, "model": _model(uncertainty_provider)},
        }

    def _build_physician_prompts(self, questions: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
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
                "endpoint": "/api/v1/scribe/prompt-response",
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
                "ui": {"component": "text_input", "multiline": True, "placeholder": "Type a short clarification"},
                "response_field": "text",
                "endpoint": "/api/v1/scribe/prompt-response",
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
                    {"label": "Keep reviewing",    "value": "keep_reviewing",    "variant": "secondary"},
                    {"label": "Mark ready later",  "value": "mark_ready_later",  "variant": "primary"},
                ],
            },
            "response_field": "selected_button",
            "endpoint": "/api/v1/scribe/prompt-response",
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
            return {
                "component": "choice_list",
                "allow_multiple": question.get("type") == "multiple_choice",
                "options": question.get("options", []),
            }
        if prompt_type == "buttons":
            return {"component": "button_group", "buttons": question.get("options", [])}
        return {"component": "text_input", "multiline": True, "placeholder": "Type a short clinical clarification"}

    def _build_note_actions(self, structured: Dict[str, Any], transcript: str) -> list[Dict[str, Any]]:
        actions = []
        lower = transcript.lower()
        if any(t in lower for t in ["كتمة", "ضيقة", "shortness", "breath", "chest"]):
            actions.append(self._note_action(
                "illness_pattern_review",
                "Illness pattern review",
                "Draft likely illness-pattern checks from symptoms and uncertain claims.",
                recommended=True,
            ))
        requires_review = structured.get("uncertainty", {}).get("overall_level") not in {"very_good", "good"}
        if requires_review or not actions:
            actions.append(self._note_action(
                "clinical_gap_scan",
                "Clinical gap scan",
                "Check missing allergy, medication, red flag, and follow-up details.",
                recommended=True,
            ))
        return actions[:2]

    def _note_action(self, action_id: str, label: str, description: str, *, recommended: bool) -> Dict[str, Any]:
        return {
            "id": action_id,
            "label": label,
            "description": description,
            "kind": "ml_prediction",
            "state": "under_development",
            "recommended": recommended,
            "ui": {"component": "button", "label": label, "disabled": False, "response_message": "Under development"},
        }

    def _build_frontend_hints(self, requires_review: bool) -> Dict[str, Any]:
        return {
            "highlight_segments": True,
            "show_uncertainty_panel": True,
            "requires_physician_review": requires_review,
            "can_finalize": not requires_review,
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
            "claim_update_suggestion": {"claim_id": None, "status": "needs_review", "reason": "Local fallback."},
            "next_prompts": [],
        }

    # ── Default structures (used when an LLM step fails completely) ───────────

    def _default_translation(self, transcript: str) -> Dict[str, Any]:
        return {
            "target_language": "en",
            "clinical_translation": transcript,
            "normalized_clinical_meaning": [],
        }

    def _default_soap(self) -> Dict[str, Any]:
        return {
            "overall_quality_level": "needs_review",
            "subjective":  {"chief_complaint": "", "history_of_present_illness": [], "associated_symptoms": [], "negative_symptoms": [], "patient_words": []},
            "objective":   {"vitals": [], "exam_findings": [], "available_data": []},
            "assessment":  {"summary": "", "possible_issues": [], "unsupported_or_inferred": []},
            "plan":        {"recommended_clarifications": [], "patient_instructions_draft": []},
        }

    def _default_uncertainty(self) -> Dict[str, Any]:
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
