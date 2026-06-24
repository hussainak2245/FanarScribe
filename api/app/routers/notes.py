from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app import store
from app.schemas.encounters import NoteApproveRequest, NoteEditRequest

router = APIRouter()


@router.patch("/{encounter_id}")
def save_note_edits(encounter_id: str, body: NoteEditRequest):
    updated_at = datetime.now(timezone.utc).isoformat()

    record = store.notes.setdefault(encounter_id, {"encounter_id": encounter_id, "sections": {}})
    record["run_id"] = body.run_id
    record["updated_at"] = updated_at

    # Merge only the non-null section values
    for field, value in body.sections.model_dump().items():
        if value is not None:
            record["sections"][field] = value

    return {"status": "saved", "updated_at": updated_at}


@router.post("/{encounter_id}/approve")
def approve_note(encounter_id: str, body: NoteApproveRequest):
    finalized_at = datetime.now(timezone.utc).isoformat()

    record = store.notes.setdefault(encounter_id, {"encounter_id": encounter_id, "sections": {}})
    record["run_id"] = body.run_id
    record["action"] = body.action
    record["finalized_at"] = finalized_at

    status = "approved" if body.action == "approve" else "draft"
    record["status"] = status

    return {"status": status, "finalized_at": finalized_at}
