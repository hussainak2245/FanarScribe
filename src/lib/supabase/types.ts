import type { ScribeResponse, ScribeSourceMode } from "@/lib/api/scribe";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SajilEncounterRow = {
  id: string;
  patient_record_number: string;
  dialect_hint: string;
  status: "draft" | "processing" | "review" | "saved" | "finalized";
  summary: string | null;
  consultation_time: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SajilScribeRunRow = {
  id: string;
  encounter_id: string;
  source_mode: ScribeSourceMode;
  manual_transcript: string | null;
  transcription: Json | null;
  translation: Json | null;
  soap_note: Json | null;
  claims: Json | null;
  uncertainty: Json | null;
  uncertain_words: Json | null;
  uncertainty_spans: Json | null;
  physician_questions: Json | null;
  physician_prompts: Json | null;
  note_actions: Json | null;
  prompt_followup: Json | null;
  providers_used: Json | null;
  models_used: Json | null;
  inference: Json | null;
  audio: Json | null;
  speaker_context: Json | null;
  request_id: string | null;
  pipeline: Json | null;
  raw_response: Json | null;
  frontend_hints: Json | null;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
};

export type SajilPromptJobRow = {
  id: string;
  encounter_id: string;
  scribe_run_id: string | null;
  endpoint_url: string | null;
  payload: Json;
  status: "ghost_pending" | "queued" | "sent" | "failed";
  response: Json | null;
  created_at: string;
};

export type SajilNoteActionRow = {
  id: string;
  encounter_id: string;
  scribe_run_id: string | null;
  action_key: string;
  label: string;
  status: "under_development" | "queued" | "completed" | "failed";
  result: Json | null;
  created_at: string;
};

export type PublicDemoRunRow = {
  id: string;
  session_id: string;
  transcript: string | null;
  dialect: string | null;
  soap_note: Json | null;
  uncertain_words: Json | null;
  pipeline: Json | null;
  provider: string | null;
  request_id: string | null;
  created_at: string;
};

export type SajilCopilotMessageRow = {
  id: string;
  encounter_id: string;
  scribe_run_id: string | null;
  role: "assistant" | "physician" | "system" | "tool";
  content: string;
  payload: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      sajil_encounters: {
        Row: SajilEncounterRow;
        Insert: Partial<SajilEncounterRow> & Pick<SajilEncounterRow, "id" | "patient_record_number">;
        Update: Partial<SajilEncounterRow>;
        Relationships: [];
      };
      sajil_scribe_runs: {
        Row: SajilScribeRunRow;
        Insert: Partial<SajilScribeRunRow> & Pick<SajilScribeRunRow, "encounter_id" | "source_mode">;
        Update: Partial<SajilScribeRunRow>;
        Relationships: [];
      };
      sajil_physician_prompt_jobs: {
        Row: SajilPromptJobRow;
        Insert: Partial<SajilPromptJobRow> & Pick<SajilPromptJobRow, "encounter_id" | "payload">;
        Update: Partial<SajilPromptJobRow>;
        Relationships: [];
      };
      sajil_note_actions: {
        Row: SajilNoteActionRow;
        Insert: Partial<SajilNoteActionRow> & Pick<SajilNoteActionRow, "encounter_id" | "action_key" | "label">;
        Update: Partial<SajilNoteActionRow>;
        Relationships: [];
      };
      sajil_copilot_messages: {
        Row: SajilCopilotMessageRow;
        Insert: Partial<SajilCopilotMessageRow> & Pick<SajilCopilotMessageRow, "encounter_id" | "role" | "content">;
        Update: Partial<SajilCopilotMessageRow>;
        Relationships: [];
      };
      public_demo_runs: {
        Row: PublicDemoRunRow;
        Insert: Partial<PublicDemoRunRow> & Pick<PublicDemoRunRow, "session_id">;
        Update: Partial<PublicDemoRunRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function toJson(value: unknown): Json | null {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value)) as Json;
}

export type PersistedScribeRun = {
  runId?: string;
  error?: string;
  response: ScribeResponse;
};
