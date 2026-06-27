"""
Clinical Copilot — two-phase pipeline.

Phase 1: Keyword-based tool routing (deterministic — no LLM).
Phase 2: Tool execution (deterministic — no LLM).
Phase 3: Fanar synthesises tool results into a plain-text clinical response.
"""
import json
from typing import Any, Dict, List, Optional

from app.prompts import build_copilot_synthesis_prompt
from app.services.fanar_service import FanarService
from app.services.groq_service import GroqService
from app.tools import run_checklist, scan_red_flags, check_drug_interactions, suggest_icd_codes

_COMPLAINT_KEYWORDS = {
    "respiratory": ["respiratory", "cough", "breath", "lung", "wheez", "asthma", "pneumonia"],
    "cardiac": ["cardiac", "heart", "chest", "palpitat", "coronary"],
    "gastrointestinal": ["gastro", "stomach", "bowel", "nausea", "vomit", "diarrhea", "reflux"],
}


class CopilotService:
    def __init__(self) -> None:
        self.fanar = FanarService()
        self.groq = GroqService()

    def chat(
        self,
        message: str,
        encounter_id: str,
        patient_record_number: str,
        conversation_history: Optional[List[Dict[str, Any]]],
        soap_note_context: Optional[str],
    ) -> Dict[str, Any]:
        soap_note_dict = self._parse_soap_context(soap_note_context)

        # ── Phase 1: Keyword-based tool routing ──────────────────────────
        tools_to_call, complaint_type = self._route_tools(message, soap_note_dict)

        # ── Phase 2: Tool execution (deterministic) ───────────────────────
        tool_results: List[Dict[str, Any]] = []
        for tool_name in tools_to_call:
            if tool_name == "checklist_tool":
                result = run_checklist(complaint_type, soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {"complaint_type": complaint_type}, "result": result})
            elif tool_name == "red_flag_tool":
                result = scan_red_flags(complaint_type, soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {"complaint_type": complaint_type}, "result": result})
            elif tool_name == "drug_interaction_tool":
                result = check_drug_interactions(soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {}, "result": result})
            elif tool_name == "icd_suggestion_tool":
                result = suggest_icd_codes(soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {}, "result": result})

        # ── Phase 3: Synthesis (plain-text response) ──────────────────────
        history_lines = self._format_history(conversation_history)
        synthesis_prompt = build_copilot_synthesis_prompt(
            message=message,
            tool_results=tool_results,
            soap_context=soap_note_context,
            history_lines=history_lines,
        )

        provider = "fanar"
        assistant_message = ""
        try:
            assistant_message = self.fanar.chat(synthesis_prompt, temperature=0.3).strip()
        except Exception:
            try:
                assistant_message = self.groq.chat(synthesis_prompt, temperature=0.3, max_tokens=600).strip()
                provider = "groq"
            except Exception:
                assistant_message = "Unable to generate a response. Please review the tool results above."
                provider = "fallback"

        return {
            "assistant_message": assistant_message,
            "sources": [],
            "suggested_follow_ups": [],
            "tool_calls": tool_results,
            "_provider": provider,
        }

    # ── helpers ──────────────────────────────────────────────────────────────

    def _route_tools(self, message: str, soap_note: Optional[Dict]) -> tuple[List[str], str]:
        """Deterministic keyword-based tool selection."""
        msg = message.lower()
        tools: List[str] = []

        if any(kw in msg for kw in ["icd", " code", "coding", "diagnosis code"]):
            tools.append("icd_suggestion_tool")
        elif any(kw in msg for kw in ["drug", "medication", "interaction", "prescription"]):
            tools.append("drug_interaction_tool")
        elif any(kw in msg for kw in ["checklist", "missing", "documented", "complete"]):
            tools.append("checklist_tool")
        elif any(kw in msg for kw in ["red flag", "risk flag", "alert"]):
            tools.append("red_flag_tool")
        # "treatment plan", general questions → no tools, pure synthesis

        complaint_type = "general"
        for ctype, keywords in _COMPLAINT_KEYWORDS.items():
            if any(kw in msg for kw in keywords):
                complaint_type = ctype
                break

        return tools, complaint_type

    def _parse_soap_context(self, soap_context: Optional[str]) -> Optional[Dict[str, Any]]:
        if not soap_context:
            return None
        try:
            return json.loads(soap_context)
        except (json.JSONDecodeError, TypeError):
            return None

    def _format_history(self, history: Optional[List[Dict[str, Any]]]) -> str:
        if not history:
            return ""
        lines = []
        for msg in history:
            role = "Physician" if msg.get("role") == "physician" else "Assistant"
            lines.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(lines)
