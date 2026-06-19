import { findPatient } from "@/lib/mock/patients";
import { getCheckpoints, getUncertaintyFlags } from "@/lib/mock/uncertainty";
import { getModelOutputs, getToolCalls } from "@/lib/mock/toolOutputs";
import { getSoapNote } from "@/lib/mock/notes";
import { getTranscript } from "@/lib/mock/transcripts";
import type { Consultation } from "@/types/consultation";
import { mockRequest } from "./client";

const encounterPatientMap: Record<string, string> = {
  E001: "P023",
  E002: "P041",
  E003: "P052",
  E004: "P078",
  E005: "P091"
};

export async function getConsultation(encounterId: string): Promise<Consultation> {
  const patient = findPatient(encounterPatientMap[encounterId] ?? "P023");
  const consultation: Consultation = {
    id: encounterId,
    patientId: patient.id,
    patient,
    startedAt: "2026-06-15T08:30:00+03:00",
    status: encounterId === "E001" ? "recording" : "review",
    noteFormat: getSoapNote(encounterId).format,
    consentMode: patient.consentStatus === "limited" ? "limited" : "full",
    transcript: getTranscript(encounterId),
    note: getSoapNote(encounterId),
    uncertaintyFlags: getUncertaintyFlags(encounterId),
    checkpoints: getCheckpoints(encounterId),
    toolCalls: getToolCalls(encounterId),
    modelOutputs: getModelOutputs(encounterId)
  };

  return mockRequest(consultation);
}

export async function generateSoapNote(encounterId: string) {
  return mockRequest(getSoapNote(encounterId), 320);
}

export async function finalizeNote(encounterId: string) {
  return mockRequest({
    encounterId,
    status: "finalized",
    finalizedAt: new Date().toISOString()
  });
}
