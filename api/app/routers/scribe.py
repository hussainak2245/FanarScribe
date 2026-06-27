import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, UploadFile, File, Form, Header, HTTPException
from app.core.config import get_settings
from app.schemas.scribe import PromptAnswerRequest
from app.services.scribe_service import ScribeService

router = APIRouter()


def _build_scribe_service(
    x_debug_fanar_api_key: Optional[str] = None,
    x_debug_groq_api_key: Optional[str] = None,
) -> ScribeService:
    if x_debug_fanar_api_key:
        os.environ["FANAR_API_KEY"] = x_debug_fanar_api_key
    if x_debug_groq_api_key:
        os.environ["GROQ_API_KEY"] = x_debug_groq_api_key
    if x_debug_fanar_api_key or x_debug_groq_api_key:
        get_settings.cache_clear()
    return ScribeService()

@router.post("/process")
async def process_scribe(
    audio_file: Optional[UploadFile] = File(None),
    patient_record_number: str = Form(...),
    encounter_id: str = Form(...),
    consultation_time: str = Form(...),
    doctor_id: Optional[str] = Form(None),
    language_hint: str = Form("ar"),
    dialect_hint: str = Form("gulf"),
    note_format: str = Form("SOAP"),
    privacy_mode: str = Form("process_audio_delete_after"),
    source_mode: str = Form("audio"),
    patient_context_json: Optional[str] = Form(None),
    manual_transcript: Optional[str] = Form(None),
    x_debug_fanar_api_key: Optional[str] = Header(None),
    x_debug_groq_api_key: Optional[str] = Header(None),
):
    try:
        scribe_service = _build_scribe_service(x_debug_fanar_api_key, x_debug_groq_api_key)
        return await scribe_service.process(
            audio_file=audio_file,
            patient_record_number=patient_record_number,
            encounter_id=encounter_id,
            consultation_time=consultation_time,
            doctor_id=doctor_id,
            language_hint=language_hint,
            dialect_hint=dialect_hint,
            note_format=note_format,
            privacy_mode=privacy_mode,
            source_mode=source_mode,
            patient_context_json=patient_context_json,
            manual_transcript=manual_transcript,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prompt-response")
async def answer_prompt(request: PromptAnswerRequest):
    try:
        scribe_service = _build_scribe_service()
        return scribe_service.respond_to_prompt(request.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/note-actions/{action_id}")
async def run_note_action(action_id: str, payload: Optional[Dict[str, Any]] = Body(None)):
    return {
        "action_id": action_id,
        "status": "under_development",
        "message": "This note-processing action is under development.",
        "payload_received": payload or {},
    }
