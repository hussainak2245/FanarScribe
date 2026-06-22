import { API_BASE_URL } from "./client";

export interface NoteUpdatePayload {
  sections?: Record<string, string>;
}

export async function updateNote(encounterId: string, payload: NoteUpdatePayload): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notes/${encounterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Failed to update note: ${res.status}`);
  return res.json();
}

export async function approveNote(
  encounterId: string,
  action: "approve" | "save_draft",
  runId?: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/notes/${encounterId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, run_id: runId ?? null })
  });
  if (!res.ok) throw new Error(`Note ${action} failed: ${res.status}`);
  return res.json();
}
