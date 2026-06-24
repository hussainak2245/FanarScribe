from fastapi import APIRouter, HTTPException

from app.schemas.encounters import CopilotChatRequest
from app.services.copilot_service import CopilotService

router = APIRouter()
_copilot = CopilotService()


@router.post("/chat")
def copilot_chat(body: CopilotChatRequest):
    try:
        result = _copilot.chat(
            message=body.message,
            encounter_id=body.encounter_id,
            patient_record_number=body.patient_record_number,
            conversation_history=[m.model_dump() for m in (body.conversation_history or [])],
            soap_note_context=body.soap_note_context,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "assistant_message": result["assistant_message"],
        "sources": result["sources"],
        "suggested_follow_ups": result["suggested_follow_ups"],
        "tool_calls": result.get("tool_calls", []),
    }
