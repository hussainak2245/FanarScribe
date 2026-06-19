import type { ScribeResponse } from "./scribe";

export type PhysicianPromptGhostResponse = {
  status: "ghost_pending" | "sent";
  message: string;
  endpointUrl?: string;
};

export type PhysicianPromptPayload = {
  encounterId: string;
  patientRecordNumber: string;
  physicianQuestions: unknown;
  uncertainty: unknown;
  scribeResponse: ScribeResponse;
};

export async function sendPhysicianPromptGhost(
  payload: PhysicianPromptPayload
): Promise<PhysicianPromptGhostResponse> {
  const endpointUrl = process.env.NEXT_PUBLIC_PHYSICIAN_PROMPT_API_URL;

  if (!endpointUrl) {
    return {
      status: "ghost_pending",
      message: "Physician prompt API is not connected yet."
    };
  }

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return {
      status: "ghost_pending",
      endpointUrl,
      message: `Physician prompt API returned ${response.status}. Kept as ghost pending.`
    };
  }

  return {
    status: "sent",
    endpointUrl,
    message: "Physician prompt payload sent."
  };
}
