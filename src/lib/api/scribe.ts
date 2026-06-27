import { API_BASE_URL } from "./client";

export type ScribeSourceMode = "manual_transcript" | "audio";

export type PromptAnswer = {
  selected_value?: string;
  label?: string;
  text?: string;
};

export type PhysicianPromptResponseInput = {
  requestId: string;
  promptId: string;
  promptType: string;
  question: string;
  answer: PromptAnswer;
  encounterId: string;
  conversationHistory?: unknown[];
};

export type ProcessScribeInput = {
  patientRecordNumber: string;
  encounterId: string;
  consultationTime: string;
  sourceMode: ScribeSourceMode;
  manualTranscript?: string;
  audioFile?: File | null;
  doctorId?: string;
  languageHint?: string;
  dialectHint?: string;
  noteFormat?: string;
  privacyMode?: string;
  patientContextJson?: string;
};

export type LogprobToken = {
  token: string;
  logprob: number;
};

export type LogprobData = {
  avg_logprob: number | null;
  normalised_score: number | null;
  below_threshold: boolean;
  token_count: number;
  top_uncertain_tokens: LogprobToken[];
};

export type ScribeResponse = {
  request_id?: string;
  status?: string;
  pipeline_version?: string;
  audio?: unknown;
  speaker_context?: unknown;
  models_used?: unknown;
  inference?: unknown;
  transcription?: unknown;
  translation?: unknown;
  soap_note?: unknown;
  claims?: unknown;
  uncertainty?: unknown;
  uncertain_words?: unknown;
  uncertainty_spans?: unknown;
  physician_questions?: unknown;
  physician_prompts?: unknown;
  note_actions?: unknown;
  prompt_followup?: unknown;
  privacy?: unknown;
  frontend_hints?: unknown;
  providers_used?: unknown;
  pipeline?: Record<string, unknown>;
  // Pipeline B fields
  logprob_data?: LogprobData;
  self_eval?: unknown;
  question_eval?: unknown;
  mandatory_review?: boolean;
  partial_check?: boolean;
  warnings?: string[];
};

export type PromptResponse = {
  assistant_message?: string;
  note_update_suggestion?: unknown;
  claim_update_suggestion?: unknown;
  next_prompts?: unknown;
  models_used?: unknown;
  inference?: unknown;
  warnings?: unknown;
};

function appendIfPresent(formData: FormData, key: string, value?: string) {
  if (value && value.trim().length > 0) {
    formData.append(key, value);
  }
}

export async function processScribe(input: ProcessScribeInput): Promise<ScribeResponse> {
  const formData = new FormData();
  formData.append("patient_record_number", input.patientRecordNumber);
  formData.append("encounter_id", input.encounterId);
  formData.append("consultation_time", input.consultationTime);
  formData.append("source_mode", input.sourceMode);

  appendIfPresent(formData, "doctor_id", input.doctorId);
  appendIfPresent(formData, "language_hint", input.languageHint);
  appendIfPresent(formData, "dialect_hint", input.dialectHint);
  appendIfPresent(formData, "note_format", input.noteFormat);
  appendIfPresent(formData, "privacy_mode", input.privacyMode);
  appendIfPresent(formData, "patient_context_json", input.patientContextJson);

  if (input.sourceMode === "audio" && input.audioFile) {
    formData.append("audio_file", input.audioFile, input.audioFile.name || "consultation.webm");
  }

  if (input.sourceMode === "manual_transcript") {
    formData.append("manual_transcript", input.manualTranscript ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/scribe/process`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `SAJIL API request failed with ${response.status}`);
  }

  return response.json() as Promise<ScribeResponse>;
}

export async function respondToPhysicianPrompt(input: PhysicianPromptResponseInput): Promise<PromptResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/scribe/prompt-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: input.requestId,
      prompt_id: input.promptId,
      prompt_type: input.promptType,
      question: input.question,
      answer: input.answer,
      scribe_context: {
        encounter_id: input.encounterId
      },
      conversation_history: input.conversationHistory ?? []
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Prompt response failed with ${response.status}`);
  }

  return response.json() as Promise<PromptResponse>;
}

export async function fetchDemo(key: string): Promise<ScribeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/demo/${encodeURIComponent(key)}`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Demo fetch failed with ${response.status}`);
  }

  return response.json() as Promise<ScribeResponse>;
}

export async function runNoteAction(actionId: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/scribe/note-actions/${encodeURIComponent(actionId)}`, {
    method: "POST"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Note action failed with ${response.status}`);
  }

  return response.json() as Promise<{ status?: string }>;
}
