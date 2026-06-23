import { API_BASE_URL } from "./client";

export interface CopilotHistoryMessage {
  role: "physician" | "assistant";
  content: string;
}

export interface CopilotChatPayload {
  encounter_id: string;
  patient_record_number?: string;
  message: string;
  conversation_history: CopilotHistoryMessage[];
  soap_note_context?: unknown;
}

export interface CopilotToolCallResult {
  tool: string;
  complaint_type?: string;
  missing?: string[];
  present?: string[];
  completeness_score?: number;
  flags_detected?: string[];
  flags_missing?: string[];
}

export interface CopilotChatResponse {
  assistant_message: string;
  /** backward compat — old API used this field */
  response?: string;
  tool_calls?: CopilotToolCallResult[];
  suggested_follow_ups?: string[];
  sources?: string[];
}

export async function sendCopilotMessage(payload: CopilotChatPayload): Promise<CopilotChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/copilot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Copilot unavailable: ${res.status}`);
  return res.json();
}
