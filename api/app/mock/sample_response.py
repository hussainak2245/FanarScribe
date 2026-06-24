from typing import Any, Dict

def build_mock_response(transcript: str, dialect_hint: str) -> Dict[str, Any]:
    return {
        "transcription": {
            "language_detected": "ar",
            "dialect_hint": dialect_hint,
            "raw_text": transcript,
            "cleaned_text": transcript,
            "segments": [{"id": "seg_001", "speaker": "patient", "start": None, "end": None, "text": transcript, "confidence": 0.75}],
        },
        "translation": {
            "target_language": "en",
            "clinical_translation": "The patient reports an unclear symptom that requires physician review.",
            "normalized_clinical_meaning": [{"arabic_evidence": transcript, "english_meaning": "Patient report requires clinical clarification.", "certainty": "medium", "notes": "Mock fallback was used."}],
        },
        "soap_note": {
            "overall_quality_level": "needs_review",
            "subjective": {"chief_complaint": "Unclear symptom requiring clarification.", "history_of_present_illness": [transcript], "associated_symptoms": [], "negative_symptoms": [], "patient_words": [transcript]},
            "objective": {"vitals": [], "exam_findings": [], "available_data": []},
            "assessment": {"summary": "Draft note requires physician review.", "possible_issues": [], "unsupported_or_inferred": ["Clinical meaning not fully confirmed."]},
            "plan": {"recommended_clarifications": ["Clarify the main symptom and missing safety details."], "patient_instructions_draft": []},
        },
        "claims": [],
        "uncertainty": {
            "overall_score": 0.55,
            "overall_level": "needs_review",
            "overall_label": "Needs review",
            "summary": "Mock fallback used; physician review required.",
            "dimensions": {
                "transcription_quality": {"score": 0.70, "level": "good"},
                "translation_quality": {"score": 0.55, "level": "needs_review"},
                "clinical_extraction": {"score": 0.55, "level": "needs_review"},
                "evidence_support": {"score": 0.55, "level": "needs_review"},
                "clinical_completeness": {"score": 0.40, "level": "poor"},
            },
        },
        "uncertain_words": [],
        "physician_questions": [{
            "id": "q_001", "priority": "high", "type": "free_text", "title": "Clarify main complaint",
            "question": "What is the patient's main clinical complaint?",
            "reason": "The fallback response could not confidently structure the consultation.",
            "linked_uncertain_word_ids": [], "linked_claim_ids": [], "options": [],
        }],
    }
