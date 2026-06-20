import type { ScribeResponse, ScribeSourceMode } from "@/lib/api/scribe";
import { getSupabaseBrowserClient } from "./client";
import { toJson, type Json } from "./types";

export type SaveScribeRunInput = {
  encounterId: string;
  patientRecordNumber: string;
  dialectHint: string;
  consultationTime: string;
  sourceMode: ScribeSourceMode;
  manualTranscript?: string;
  response: ScribeResponse;
};

export async function saveScribeRun(input: SaveScribeRunInput) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { runId: undefined, error: "Supabase is not configured" };
  }

  const summary = [
    typeof input.response.translation === "object" ? null : input.response.translation,
    input.manualTranscript
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 180);

  const encounter = await supabase
    .from("sajil_encounters")
    .upsert({
      id: input.encounterId,
      patient_record_number: input.patientRecordNumber,
      dialect_hint: input.dialectHint,
      consultation_time: input.consultationTime,
      status: "review",
      summary: summary || null
    })
    .select("id")
    .single();

  if (encounter.error) {
    return { runId: undefined, error: encounter.error.message };
  }

  const run = await supabase
    .from("sajil_scribe_runs")
    .insert({
      encounter_id: input.encounterId,
      source_mode: input.sourceMode,
      manual_transcript: input.manualTranscript || null,
      transcription: toJson(input.response.transcription),
      translation: toJson(input.response.translation),
      soap_note: toJson(input.response.soap_note),
      claims: toJson(input.response.claims),
      uncertainty: toJson(input.response.uncertainty),
      uncertain_words: toJson(input.response.uncertain_words),
      uncertainty_spans: toJson(input.response.uncertainty_spans),
      physician_questions: toJson(input.response.physician_questions),
      physician_prompts: toJson(input.response.physician_prompts),
      note_actions: toJson(input.response.note_actions),
      prompt_followup: toJson(input.response.prompt_followup),
      providers_used: toJson(input.response.providers_used),
      models_used: toJson(input.response.models_used),
      inference: toJson(input.response.inference),
      audio: toJson(input.response.audio),
      speaker_context: toJson(input.response.speaker_context),
      request_id: input.response.request_id ?? null,
      raw_response: toJson(input.response),
      frontend_hints: toJson(input.response.frontend_hints),
      status: "completed"
    })
    .select("id")
    .single();

  if (run.error) {
    return { runId: undefined, error: run.error.message };
  }

  return { runId: run.data.id, error: undefined };
}

export async function listCopilotMessages(encounterId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: undefined, error: "Supabase is not configured" };

  const { data, error } = await supabase
    .from("sajil_copilot_messages")
    .select("id, encounter_id, scribe_run_id, role, content, payload, created_at")
    .eq("encounter_id", encounterId)
    .order("created_at", { ascending: true })
    .limit(50);

  return { data, error: error?.message };
}

export async function saveCopilotMessage({
  encounterId,
  runId,
  role,
  content,
  payload
}: {
  encounterId: string;
  runId?: string;
  role: "assistant" | "physician" | "system" | "tool";
  content: string;
  payload?: Json;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const { error } = await supabase.from("sajil_copilot_messages").insert({
    encounter_id: encounterId,
    scribe_run_id: runId ?? null,
    role,
    content,
    payload: payload ?? {}
  });

  return { error: error?.message };
}

export async function listEncounters() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: undefined, error: "Supabase is not configured" };

  const { data, error } = await supabase
    .from("sajil_encounters")
    .select("id, patient_record_number, status, summary, consultation_time")
    .order("consultation_time", { ascending: false })
    .limit(20);

  return { data, error: error?.message };
}

export async function saveGhostPromptJob({
  encounterId,
  runId,
  payload,
  endpointUrl,
  response
}: {
  encounterId: string;
  runId?: string;
  payload: Json;
  endpointUrl?: string;
  response?: Json;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const { error } = await supabase.from("sajil_physician_prompt_jobs").insert({
    encounter_id: encounterId,
    scribe_run_id: runId ?? null,
    endpoint_url: endpointUrl ?? null,
    payload,
    response: response ?? null,
    status: "ghost_pending"
  });

  return { error: error?.message };
}

export async function saveNoteAction({
  encounterId,
  runId,
  actionKey,
  label
}: {
  encounterId: string;
  runId?: string;
  actionKey: string;
  label: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "Supabase is not configured" };

  const { error } = await supabase.from("sajil_note_actions").insert({
    encounter_id: encounterId,
    scribe_run_id: runId ?? null,
    action_key: actionKey,
    label,
    status: "under_development",
    result: { message: "Under development" }
  });

  return { error: error?.message };
}
