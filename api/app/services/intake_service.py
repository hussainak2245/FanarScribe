"""
Pre-consultation intake service.
If the patient's chief complaint contains Arabic text, Fanar normalises it
to English, flags clinical risks, and generates suggested doctor questions.
Falls back to Groq, then passthrough if both fail.
"""
import re
from typing import Any, Dict

from app.core.json_utils import extract_json_object
from app.prompts import build_intake_prompt
from app.services.fanar_service import FanarService
from app.services.groq_service import GroqService

_ARABIC_RE = re.compile(r"[؀-ۿ]")


def _has_arabic(text: str) -> bool:
    return bool(_ARABIC_RE.search(text))


class IntakeService:
    def __init__(self) -> None:
        self.fanar = FanarService()
        self.groq = GroqService()

    def process_complaint(
        self, chief_complaint: str, dialect_hint: str = "gulf"
    ) -> Dict[str, Any]:
        """
        Normalise an Arabic chief complaint for the pre-visit summary.
        Returns a passthrough result if the text is not Arabic.
        """
        if not _has_arabic(chief_complaint):
            return {
                "normalized_complaint": chief_complaint,
                "risk_flags": [],
                "suggested_questions": [],
                "provider": "passthrough",
            }

        prompt = build_intake_prompt(chief_complaint, dialect_hint)
        provider = "fanar"

        try:
            raw = self.fanar.chat(prompt, temperature=0)
            parsed: Dict[str, Any] = extract_json_object(raw)
        except Exception:
            try:
                raw = self.groq.chat(prompt, temperature=0, max_tokens=600)
                parsed = extract_json_object(raw)
                provider = "groq"
            except Exception:
                return {
                    "normalized_complaint": chief_complaint,
                    "risk_flags": [],
                    "suggested_questions": [],
                    "provider": "fallback",
                }

        return {
            "normalized_complaint": parsed.get("normalized_complaint", chief_complaint),
            "risk_flags": parsed.get("risk_flags", []),
            "suggested_questions": parsed.get("suggested_questions", []),
            "provider": provider,
        }
