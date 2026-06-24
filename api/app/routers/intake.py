import uuid

from fastapi import APIRouter

from app import store
from app.schemas.encounters import PatientIntakeRequest
from app.services.intake_service import IntakeService

router = APIRouter()
_intake = IntakeService()


@router.post("")
def submit_intake(body: PatientIntakeRequest):
    intake_id = f"INT_{uuid.uuid4().hex[:8].upper()}"

    ai_output = _intake.process_complaint(
        body.chief_complaint,
        dialect_hint=body.dialect_hint or "gulf",
    )

    record = {
        "intake_id": intake_id,
        **body.model_dump(),
        "ai_output": ai_output,
    }
    store.intakes[intake_id] = record

    return {
        "status": "received",
        "intake_id": intake_id,
        "normalized_complaint": ai_output.get("normalized_complaint"),
        "risk_flags": ai_output.get("risk_flags", []),
        "suggested_questions": ai_output.get("suggested_questions", []),
        "provider": ai_output.get("provider"),
    }
