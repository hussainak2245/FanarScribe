import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app import store
from app.schemas.encounters import CreateEncounterRequest

router = APIRouter()


@router.post("")
def create_encounter(body: CreateEncounterRequest):
    encounter_id = f"E_{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()

    record = {
        "encounter_id": encounter_id,
        "patient_record_number": body.patient_record_number,
        "doctor_id": body.doctor_id,
        "consultation_time": body.consultation_time,
        "status": "open",
        "created_at": created_at,
    }
    store.encounters[encounter_id] = record

    # Seed doctor stats counter
    if body.doctor_id:
        stats = store.doctor_stats.setdefault(body.doctor_id, {"total": 0, "today": 0, "total_ms": 0})
        stats["total"] += 1
        today = datetime.now(timezone.utc).date().isoformat()
        if record.get("_date") != today:
            stats["today"] = stats.get("today", 0) + 1
        record["_date"] = today

    return {
        "encounter_id": encounter_id,
        "status": "open",
        "created_at": created_at,
    }
