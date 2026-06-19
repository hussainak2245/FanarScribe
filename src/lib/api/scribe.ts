import { API_BASE_URL } from "./client";

export type ScribeSourceMode = "manual_transcript" | "audio";

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

export type ScribeResponse = {
  transcription?: unknown;
  translation?: unknown;
  soap_note?: unknown;
  claims?: unknown;
  uncertainty?: unknown;
  uncertain_words?: unknown;
  physician_questions?: unknown;
  privacy?: unknown;
  frontend_hints?: unknown;
  providers_used?: unknown;
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
