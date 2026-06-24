from datetime import datetime, timezone

from fastapi import APIRouter

from app import store

router = APIRouter()

BASELINE_MINUTES_PER_NOTE = 15  # assumed manual note time


@router.get("/doctor")
def doctor_stats(doctor_id: str):
    today = datetime.now(timezone.utc).date().isoformat()

    consultations_today = sum(
        1
        for enc in store.encounters.values()
        if enc.get("doctor_id") == doctor_id and enc.get("_date") == today
    )
    total_consultations = sum(
        1 for enc in store.encounters.values() if enc.get("doctor_id") == doctor_id
    )

    notes_ready = sum(
        1
        for enc_id, note in store.notes.items()
        if note.get("status") == "approved"
        and store.encounters.get(enc_id, {}).get("doctor_id") == doctor_id
    )

    avg_saved = BASELINE_MINUTES_PER_NOTE
    total_saved = total_consultations * avg_saved

    return {
        "consultations_today": consultations_today,
        "avg_minutes_saved_per_consultation": avg_saved,
        "total_minutes_saved": total_saved,
        "notes_ready": notes_ready,
    }
