"""
Clinical Copilot — agentic two-phase loop.

Phase 1: Fanar selects which tools to call based on the physician's question.
Phase 2: Tools execute (deterministic — no LLM).
Phase 3: Fanar synthesises tool results into a clinical response.

Fanar is the primary model for both phases; Groq is the documented fallback.
"""
import json
from typing import Any, Dict, List, Optional

from app.core.json_utils import extract_json_object
from app.prompts import build_copilot_synthesis_prompt, build_tool_selection_prompt
from app.services.fanar_service import FanarService
from app.services.groq_service import GroqService
from app.tools import run_checklist, scan_red_flags


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

        # ── Phase 1: Tool selection ───────────────────────────────────────
        tool_selection = self._select_tools(message, soap_note_context)
        tools_to_call: List[str] = tool_selection.get("tools_to_call", [])[:2]
        complaint_type: str = tool_selection.get("complaint_type", "general")

        # ── Phase 2: Tool execution (deterministic) ───────────────────────
        tool_results: List[Dict[str, Any]] = []
        for tool_name in tools_to_call:
            if tool_name == "checklist_tool":
                result = run_checklist(complaint_type, soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {"complaint_type": complaint_type}, "result": result})
            elif tool_name == "red_flag_tool":
                result = scan_red_flags(complaint_type, soap_note_dict)
                tool_results.append({"tool": tool_name, "input": {"complaint_type": complaint_type}, "result": result})

        # ── Phase 3: Synthesis ────────────────────────────────────────────
        history_lines = self._format_history(conversation_history)
        synthesis_prompt = build_copilot_synthesis_prompt(
            message=message,
            tool_results=tool_results,
            soap_context=soap_note_context,
            history_lines=history_lines,
        )

        provider = "fanar"
        parsed: Dict[str, Any] = {}
        try:
            raw = self.fanar.chat(synthesis_prompt, temperature=0.3)
            parsed = extract_json_object(raw)
        except Exception as fanar_err:
            try:
                raw = self.groq.chat(synthesis_prompt, temperature=0.3, max_tokens=1200)
                parsed = extract_json_object(raw)
                provider = "groq"
            except Exception:
                parsed = {
                    "assistant_message": (
                        "I am unable to process your question right now. "
                        "Please consult your clinical resources directly."
                    ),
                    "sources": [],
                    "suggested_follow_ups": [],
                }
                provider = "fallback"

        return {
            "assistant_message": parsed.get("assistant_message", ""),
            "sources": parsed.get("sources", []),
            "suggested_follow_ups": parsed.get("suggested_follow_ups", []),
            "tool_calls": tool_results,
            "_provider": provider,
        }

    # ── helpers ──────────────────────────────────────────────────────────────

    def _select_tools(self, message: str, soap_context: Optional[str]) -> Dict[str, Any]:
        prompt = build_tool_selection_prompt(message, soap_context)
        try:
            raw = self.fanar.chat(prompt, temperature=0)
            return extract_json_object(raw)
        except Exception:
            try:
                raw = self.groq.chat(prompt, temperature=0, max_tokens=200)
                return extract_json_object(raw)
            except Exception:
                return {"tools_to_call": [], "complaint_type": "general"}

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
