import { API_BASE_URL } from "./client";

export interface CopilotHistoryMessage {
  role: "physician" | "assistant";
  content: string;
}

export interface CopilotChatPayload {
  encounter_id: string;
  message: string;
  conversation_history: CopilotHistoryMessage[];
  soap_note_context?: unknown;
}

export interface CopilotChatResponse {
  response: string;
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
