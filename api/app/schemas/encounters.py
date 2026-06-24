from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


class CreateEncounterRequest(BaseModel):
    patient_record_number: str
    doctor_id: Optional[str] = None
    consultation_time: str


class PatientIntakeRequest(BaseModel):
    appointment_id: str
    patient_record_number: str
    chief_complaint: str
    symptom_duration: Optional[str] = None
    severity: Optional[str] = None
    dialect_hint: Optional[str] = None
    consent_given: bool = False
    submitted_at: Optional[str] = None


class NoteSections(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


class NoteEditRequest(BaseModel):
    run_id: Optional[str] = None
    sections: NoteSections


class NoteApproveRequest(BaseModel):
    action: Literal["approve", "save_draft"]
    run_id: str


class CopilotChatMessage(BaseModel):
    role: str
    content: str


class CopilotChatRequest(BaseModel):
    encounter_id: str
    patient_record_number: str
    message: str
    conversation_history: Optional[List[CopilotChatMessage]] = None
    soap_note_context: Optional[str] = None


class SendInstructionsRequest(BaseModel):
    encounter_id: str
    appointment_id: Optional[str] = None
    patient_record_number: str
    instructions_text: str
    delivery_method: Literal["sms", "whatsapp", "email", "portal"]
