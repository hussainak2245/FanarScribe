"""
Uncertainty engine — rule-based layer that runs on top of the LLM-generated output.

Three tiers:
  Level 1 (this file): Arabic phrase bank, risk weights, negation guardrails,
                        complaint checklists, missingness detection.
  Level 2 (scribe_service): LLM claim-evidence scoring via build_uncertainty_prompt.
  Level 3 (copilot_service): Tool-disagreement detection via checklist/red-flag tools.
"""
from typing import Any, Dict, List, Optional

# ── Arabic ambiguity phrase bank ──────────────────────────────────────────────
AMBIGUOUS_ARABIC_TERMS: Dict[str, Dict[str, Any]] = {
    "كتمة": {
        "possible_meanings": ["chest tightness", "shortness of breath", "both"],
        "reason": "Gulf dialect phrase with multiple distinct clinical meanings.",
        "type": "dialect_ambiguity",
    },
    "ضيقة": {
        "possible_meanings": ["shortness of breath", "chest tightness", "distress"],
        "reason": "Arabic phrase may refer to breathing difficulty or emotional/physical distress.",
        "type": "dialect_ambiguity",
    },
    "دوخة": {
        "possible_meanings": ["dizziness", "lightheadedness", "vertigo"],
        "reason": "Symptom needs clinical clarification — causes range from benign to serious.",
        "type": "dialect_ambiguity",
    },
    "نغزات": {
        "possible_meanings": ["stabbing pain", "tingling", "sharp prick sensations"],
        "reason": "Descriptor for pain character; clinically distinct meanings.",
        "type": "dialect_ambiguity",
    },
    "خفقان": {
        "possible_meanings": ["palpitations", "racing heart", "irregular heartbeat"],
        "reason": "Cardiac symptom requiring characterisation.",
        "type": "dialect_ambiguity",
    },
    "تعبان": {
        "possible_meanings": ["tired", "unwell", "generally feeling bad"],
        "reason": "Vague subjective term — non-specific without further questioning.",
        "type": "dialect_ambiguity",
    },
}

# ── Risk weights ──────────────────────────────────────────────────────────────
RISK_WEIGHTS: Dict[str, str] = {
    "allergy":               "critical",
    "medication_dose":       "critical",
    "negation":              "critical",   # ما / ليس flips meaning
    "numeric":               "critical",   # dosages, durations, frequencies
    "chest_pain":            "high",
    "shortness_of_breath":   "high",
    "oxygen_saturation":     "high",
    "anticoagulant":         "high",
    "pregnancy":             "high",
    "dialect_ambiguity":     "high",
    "transcription_noise":   "medium",
    "clinical_inference":    "medium",
    "mild_symptom":          "medium",
    "general":               "medium",
}

# Arabic negation markers — if any appear within 20 chars of an uncertain term, risk → critical
ARABIC_NEGATION_MARKERS = ["ما ", "لا ", "ليس", "مو ", "مب ", "لم ", "لن ", "غير "]

# ── Complaint-type detection keywords ─────────────────────────────────────────
_COMPLAINT_KEYWORDS: Dict[str, List[str]] = {
    "respiratory": [
        "كتمة", "ضيقة", "ما أقدر أتنفس", "كحة",
        "shortness", "breath", "cough", "chest", "wheez", "respiratory",
    ],
    "cardiac": [
        "خفقان", "وجع صدر", "ألم صدر",
        "palpitat", "cardiac", "heart", "chest pain",
    ],
    "gastrointestinal": [
        "معدة", "بطن", "إسهال", "قيء",
        "stomach", "abdom", "nausea", "vomit", "bowel",
    ],
}


class UncertaintyService:

    def stabilize(self, data: Dict[str, Any], transcript: str, dialect_hint: str) -> Dict[str, Any]:
        """
        Additive rule-based pass over the assembled pipeline output.
        Never overwrites keys already populated by the LLM steps.
        """
        data = self._ensure_base_keys(data, transcript, dialect_hint)
        data = self._ensure_ambiguous_terms(data, transcript)
        data = self._apply_risk_weights(data, transcript)
        data = self._run_completeness_checks(data, transcript)
        data["uncertainty_spans"] = self.build_transcript_uncertainty_spans(data)
        return data

    # ── Public helper used by scribe_service ──────────────────────────────────

    def build_transcript_uncertainty_spans(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        segments = data.get("transcription", {}).get("segments", [])
        spans = []
        for word in data.get("uncertain_words", []):
            text = word.get("text", "")
            if not text:
                continue
            segment = self._find_segment_for_word(segments, word)
            segment_text = segment.get("text", "") if segment else ""
            start_char = segment_text.find(text) if segment_text else -1
            end_char = start_char + len(text) if start_char >= 0 else None

            risk = word.get("risk", "medium")
            color = {"critical": "#dc2626", "high": "#d97706", "medium": "#6b7280"}.get(risk, "#d97706")

            spans.append({
                "id": f"span_{word.get('id', len(spans) + 1)}",
                "uncertain_word_id": word.get("id"),
                "segment_id": (segment or {}).get("id") or word.get("segment_id"),
                "text": text,
                "start_char": start_char if start_char >= 0 else None,
                "end_char": end_char,
                "score": word.get("score"),
                "level": word.get("level"),
                "risk": risk,
                "reason": word.get("reason"),
                "linked_claim_ids": word.get("linked_claim_ids", []),
                "render": {
                    "underline": True,
                    "underline_style": "wavy",
                    "color": color,
                    "tooltip": word.get("reason"),
                },
            })
        return spans

    # ── Private helpers ────────────────────────────────────────────────────────

    def _ensure_base_keys(self, data: Dict[str, Any], transcript: str, dialect_hint: str) -> Dict[str, Any]:
        data.setdefault("transcription", {
            "language_detected": "ar",
            "dialect_hint": dialect_hint,
            "raw_text": transcript,
            "cleaned_text": transcript,
            "segments": [{"id": "seg_001", "speaker": "unknown", "start": None, "end": None, "text": transcript, "confidence": 0.75}],
        })
        data.setdefault("translation", {"target_language": "en", "clinical_translation": "", "normalized_clinical_meaning": []})
        data.setdefault("soap_note", {
            "overall_quality_level": "needs_review",
            "subjective":  {"chief_complaint": "", "history_of_present_illness": [], "associated_symptoms": [], "negative_symptoms": [], "patient_words": []},
            "objective":   {"vitals": [], "exam_findings": [], "available_data": []},
            "assessment":  {"summary": "", "possible_issues": [], "unsupported_or_inferred": []},
            "plan":        {"recommended_clarifications": [], "patient_instructions_draft": []},
        })
        data.setdefault("claims", [])
        data.setdefault("uncertain_words", [])
        data.setdefault("physician_questions", [])
        data.setdefault("uncertainty", {
            "overall_score": 0.60,
            "overall_level": "needs_review",
            "overall_label": "Needs review",
            "summary": "This draft needs physician review.",
            "claim_evaluations": [],
            "dimensions": {
                "transcription_quality": {"score": 0.75, "level": "good"},
                "translation_quality":   {"score": 0.65, "level": "needs_review"},
                "clinical_extraction":   {"score": 0.70, "level": "good"},
                "evidence_support":      {"score": 0.60, "level": "needs_review"},
                "clinical_completeness": {"score": 0.45, "level": "poor"},
            },
        })
        return data

    def _ensure_ambiguous_terms(self, data: Dict[str, Any], transcript: str) -> Dict[str, Any]:
        existing_texts = {w.get("text") for w in data.get("uncertain_words", [])}
        for term, info in AMBIGUOUS_ARABIC_TERMS.items():
            if term not in transcript or term in existing_texts:
                continue

            word_id = f"uw_{len(data['uncertain_words']) + 1:03d}"
            claim_id = f"claim_{len(data['claims']) + 1:03d}"

            data["uncertain_words"].append({
                "id": word_id,
                "text": term,
                "segment_id": "seg_001",
                "score": 0.82,
                "level": "high_uncertainty",
                "type": info["type"],
                "possible_meanings": info["possible_meanings"],
                "reason": info["reason"],
                "linked_claim_ids": [claim_id],
                "risk": RISK_WEIGHTS.get(info["type"], "high"),
            })
            data["claims"].append({
                "id": claim_id,
                "section": "subjective",
                "text": f"Patient reports a symptom expressed as '{term}'.",
                "evidence": [{"source": "transcript", "text": term, "segment_id": "seg_001"}],
                "confidence": 0.55,
                "level": "needs_review",
                "status": "physician_required",
                "reason": info["reason"],
            })

            # Only add a question if one for this term doesn't already exist
            already_asked = any(
                term in q.get("question", "") or term in q.get("title", "")
                for q in data["physician_questions"]
            )
            if not already_asked:
                data["physician_questions"].append({
                    "id": f"q_{len(data['physician_questions']) + 1:03d}",
                    "priority": "high",
                    "type": "single_choice",
                    "title": f"Clarify '{term}'",
                    "question": f"What does the patient mean by \"{term}\" in this context?",
                    "reason": info["reason"],
                    "linked_uncertain_word_ids": [word_id],
                    "linked_claim_ids": [claim_id],
                    "options": [
                        {"label": m, "value": m.lower().replace(" ", "_")}
                        for m in info["possible_meanings"]
                    ] + [{"label": "Remove from note", "value": "remove"}],
                })
        return data

    def _apply_risk_weights(self, data: Dict[str, Any], transcript: str) -> Dict[str, Any]:
        for word in data.get("uncertain_words", []):
            word_type = word.get("type", "general")
            base_risk = RISK_WEIGHTS.get(word_type, "medium")

            # Bump to critical if a negation marker appears near the term
            term = word.get("text", "")
            if term and self._near_negation(term, transcript):
                base_risk = "critical"
                word["negation_detected"] = True

            word["risk"] = base_risk
        return data

    def _near_negation(self, term: str, transcript: str, window: int = 25) -> bool:
        idx = transcript.find(term)
        if idx == -1:
            return False
        context = transcript[max(0, idx - window): idx + len(term) + window]
        return any(marker in context for marker in ARABIC_NEGATION_MARKERS)

    def _run_completeness_checks(self, data: Dict[str, Any], transcript: str) -> Dict[str, Any]:
        """
        Complaint-type-aware missingness checks.
        Adds physician questions and escalates uncertainty level when key items are absent.
        """
        complaint_type = self._detect_complaint_type(transcript, data.get("soap_note", {}))
        all_text = (transcript + str(data.get("soap_note", {}))).lower()
        existing_question_texts = {q.get("question", "").lower() for q in data.get("physician_questions", [])}

        gaps: List[Dict[str, str]] = []

        if complaint_type == "respiratory":
            if not any(t in all_text for t in ["spo2", "oxygen saturation", "تشبع"]):
                gaps.append({"item": "SpO2 / oxygen saturation", "risk": "high"})
            if not any(t in all_text for t in ["allerg", "حساسية"]):
                gaps.append({"item": "allergy status", "risk": "high"})

        elif complaint_type == "cardiac":
            if not any(t in all_text for t in ["allerg", "حساسية"]):
                gaps.append({"item": "allergy status", "risk": "high"})
            if not any(t in all_text for t in ["medic", "drug", "دواء", "علاج"]):
                gaps.append({"item": "current medications", "risk": "high"})

        else:
            # General check — allergy always required
            if not any(t in all_text for t in ["allerg", "حساسية"]):
                gaps.append({"item": "allergy status", "risk": "medium"})

        for gap in gaps:
            q_text = f"Was {gap['item']} discussed or documented?"
            if q_text.lower() in existing_question_texts:
                continue
            data["physician_questions"].append({
                "id": f"q_{len(data['physician_questions']) + 1:03d}",
                "priority": "high" if gap["risk"] == "high" else "medium",
                "type": "single_choice",
                "title": f"Missing: {gap['item']}",
                "question": q_text,
                "reason": f"{gap['item']} is missing and clinically important for a {complaint_type} complaint.",
                "linked_uncertain_word_ids": [],
                "linked_claim_ids": [],
                "options": [
                    {"label": "Present — not in note", "value": "present_unlisted"},
                    {"label": "Not discussed",          "value": "not_discussed"},
                    {"label": "Not applicable",         "value": "not_applicable"},
                ],
            })
            if gap["risk"] == "high":
                data["uncertainty"]["overall_level"] = "needs_review"
                data["uncertainty"]["overall_label"] = "Needs review"

        return data

    def _detect_complaint_type(self, transcript: str, soap_note: Dict[str, Any]) -> str:
        combined = (transcript + str(soap_note)).lower()
        for complaint_type, keywords in _COMPLAINT_KEYWORDS.items():
            if any(kw in combined for kw in keywords):
                return complaint_type
        return "general"

    def _find_segment_for_word(
        self, segments: List[Dict[str, Any]], word: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        segment_id = word.get("segment_id")
        if segment_id:
            for seg in segments:
                if seg.get("id") == segment_id:
                    return seg
        text = word.get("text", "")
        for seg in segments:
            if text and text in seg.get("text", ""):
                return seg
        return segments[0] if segments else None
