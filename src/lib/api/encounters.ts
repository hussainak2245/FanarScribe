import { API_BASE_URL } from "./client";

export interface CreateEncounterResponse {
  encounter_id: string;
  status: string;
  created_at?: string;
}

export async function createEncounter(patientRecordNumber?: string): Promise<CreateEncounterResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/encounters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_record_number: patientRecordNumber ?? "" })
  });
  if (!res.ok) throw new Error(`Failed to create encounter: ${res.status}`);
  return res.json();
}
