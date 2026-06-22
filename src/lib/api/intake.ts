import { API_BASE_URL } from "./client";

export interface PatientIntakePayload {
  encounter_id: string;
  symptoms?: string;
  duration?: string;
  severity?: string;
  allergies?: string;
  current_medications?: string;
  consent?: boolean;
}

export async function submitPatientIntake(payload: PatientIntakePayload): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/patient-intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Intake submission failed: ${res.status}`);
  return res.json();
}
