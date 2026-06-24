from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

QualityLevel = Literal["very_good", "good", "needs_review", "poor", "very_poor"]
QuestionType = Literal["single_choice", "multiple_choice", "yes_no", "free_text", "numeric", "confirm_reject"]
PromptType = Literal["mcq", "short_answer", "buttons"]

class TranscriptSegment(BaseModel):
    id: str
    speaker: str = "unknown"
    start: Optional[float] = None
    end: Optional[float] = None
    text: str
    confidence: Optional[float] = None

class TranscriptionResult(BaseModel):
    language_detected: str = "ar"
    dialect_hint: Optional[str] = None
    raw_text: str
    cleaned_text: str
    segments: List[TranscriptSegment]

class TranslationItem(BaseModel):
    arabic_evidence: str
    english_meaning: str
    certainty: str
    notes: Optional[str] = None

class TranslationResult(BaseModel):
    target_language: str = "en"
    clinical_translation: str
    normalized_clinical_meaning: List[TranslationItem]

class SoapNote(BaseModel):
    overall_quality_level: QualityLevel
    subjective: Dict[str, Any]
    objective: Dict[str, Any]
    assessment: Dict[str, Any]
    plan: Dict[str, Any]

class Claim(BaseModel):
    id: str
    section: str
    text: str
    evidence: List[Dict[str, Any]]
    confidence: float
    level: QualityLevel
    status: str
    reason: Optional[str] = None

class UncertainWord(BaseModel):
    id: str
    text: str
    segment_id: Optional[str] = None
    score: float
    level: str
    type: str
    possible_meanings: List[str] = Field(default_factory=list)
    reason: str
    linked_claim_ids: List[str] = Field(default_factory=list)

class UncertaintySpan(BaseModel):
    id: str
    uncertain_word_id: Optional[str] = None
    segment_id: Optional[str] = None
    text: str
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    score: Optional[float] = None
    level: Optional[str] = None
    reason: Optional[str] = None
    linked_claim_ids: List[str] = Field(default_factory=list)
    render: Dict[str, Any] = Field(default_factory=dict)

class PhysicianQuestion(BaseModel):
    id: str
    priority: str
    type: QuestionType
    title: str
    question: str
    reason: str
    linked_uncertain_word_ids: List[str] = Field(default_factory=list)
    linked_claim_ids: List[str] = Field(default_factory=list)
    options: List[Dict[str, str]] = Field(default_factory=list)

class PhysicianPrompt(BaseModel):
    id: str
    source_question_id: Optional[str] = None
    prompt_type: PromptType
    priority: str
    title: str
    question: str
    reason: str
    required: bool = True
    ui: Dict[str, Any] = Field(default_factory=dict)
    response_field: str
    endpoint: str = "/api/v1/scribe/prompt-response"

class PromptAnswerRequest(BaseModel):
    request_id: str
    prompt_id: str
    prompt_type: PromptType
    question: str
    answer: Dict[str, Any]
    scribe_context: Optional[Dict[str, Any]] = None
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)

class ScribeResponse(BaseModel):
    request_id: str
    status: str
    patient_record_number: str
    encounter_id: str
    consultation_time: str
    source_mode: str
    providers_used: Dict[str, Any]
    models_used: Dict[str, Any]
    pipeline: Dict[str, Any] = Field(default_factory=dict)
    inference: Dict[str, Any]
    audio: Dict[str, Any]
    speaker_context: Dict[str, Any]
    transcription: TranscriptionResult
    translation: TranslationResult
    soap_note: SoapNote
    claims: List[Claim]
    uncertainty: Dict[str, Any]
    uncertain_words: List[UncertainWord]
    uncertainty_spans: List[UncertaintySpan] = Field(default_factory=list)
    physician_questions: List[PhysicianQuestion]
    physician_prompts: List[PhysicianPrompt] = Field(default_factory=list)
    note_actions: List[Dict[str, Any]] = Field(default_factory=list)
    prompt_followup: Dict[str, Any] = Field(default_factory=dict)
    privacy: Dict[str, Any]
    frontend_hints: Dict[str, Any]
    warnings: List[str] = Field(default_factory=list)
