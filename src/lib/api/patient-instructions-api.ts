import { API_BASE_URL } from "./client";

export async function sendPatientInstructions(
  encounterId: string,
  editedNote?: string
): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/patient-instructions/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ encounter_id: encounterId, edited_note: editedNote ?? null })
  });
  if (!res.ok) throw new Error(`Failed to send instructions: ${res.status}`);
  return res.json();
}
