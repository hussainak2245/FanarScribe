import { findPatient } from "@/lib/mock/patients";
import { getCheckpoints, getUncertaintyFlags } from "@/lib/mock/uncertainty";
import { getModelOutputs, getToolCalls } from "@/lib/mock/toolOutputs";
import { getSoapNote } from "@/lib/mock/notes";
import { getTranscript } from "@/lib/mock/transcripts";
import { getLatestScribeRun } from "@/lib/supabase/server";
import type { Consultation } from "@/types/consultation";
import type { SoapNote, SoapSectionKey, ClinicalClaim } from "@/types/soap";
import type { UncertaintyFlag, UncertaintyStatus } from "@/types/uncertainty";
import type { PhysicianCheckpoint } from "@/types/checkpoint";
import { mockRequest } from "./client";

// ── Text extraction helpers (mirrors SajilWorkspace logic) ────────────────────

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    for (const k of ["cleaned_text", "raw_text", "clinical_translation", "text", "content", "note", "value", "summary"]) {
      if (typeof r[k] === "string") return r[k] as string;
    }
    return Object.entries(r).map(([k, v]) => { const t = asText(v); return t ? `${k.replace(/_/g, " ")}: ${t}` : ""; }).filter(Boolean).join("\n");
  }
  return "";
}

function extractSoapSections(raw: unknown): Partial<Record<SoapSectionKey, string>> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const source = (r.sections && typeof r.sections === "object") ? (r.sections as Record<string, unknown>) : r;
  const keys: SoapSectionKey[] = ["subjective", "objective", "assessment", "plan"];
  const result: Partial<Record<SoapSectionKey, string>> = {};
  for (const k of keys) {
    const text = asText(source[k]);
    if (text) result[k] = text;
  }
  return result;
}

function adaptSoapNote(raw: unknown, encounterId: string): SoapNote {
  const extracted = extractSoapSections(raw);
  const keys: SoapSectionKey[] = ["subjective", "objective", "assessment", "plan"];
  const sections = Object.fromEntries(
    keys.map((k) => {
      const text = extracted[k];
      if (!text) return [k, []];
      const claim: ClinicalClaim = {
        id: `${encounterId}_${k}`,
        section: k,
        text,
        confidence: 0.8,
        status: "likely"
      };
      return [k, [claim]];
    })
  ) as Record<SoapSectionKey, ClinicalClaim[]>;

  return {
    id: `note_${encounterId}`,
    encounterId,
    format: "SOAP",
    sections,
    readiness: 0.75,
    updatedAt: new Date().toISOString()
  };
}

function adaptUncertaintyFlags(raw: unknown, encounterId: string): UncertaintyFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).flatMap((item, i) => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    const text = asText(r.text ?? r.word ?? r.phrase);
    if (!text) return [];
    const risk = asText(r.risk);
    const status: UncertaintyStatus = risk === "critical" || risk === "high" ? "physician_required" : "unclear";
    const prompt = Array.isArray(r.possible_meanings) && r.possible_meanings.length > 0
      ? `Possible meanings: ${(r.possible_meanings as unknown[]).map(asText).join(", ")}`
      : asText(r.reason);
    const flag: UncertaintyFlag = {
      id: `U_${encounterId}_${i}`,
      encounterId,
      label: text,
      text,
      status,
      confidence: typeof r.score === "number" ? r.score : 0.6,
      source: "transcript",
      prompt: prompt || undefined,
      severity: risk === "critical" ? "high" : risk === "high" ? "medium" : "low"
    };
    return [flag];
  });
}

function adaptCheckpoints(rawPrompts: unknown, rawQuestions: unknown, encounterId: string): PhysicianCheckpoint[] {
  const source = Array.isArray(rawPrompts) ? rawPrompts : Array.isArray(rawQuestions) ? rawQuestions : [];
  return source.slice(0, 6).flatMap((item, i) => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    const question = asText(r.question ?? r.prompt ?? r.text ?? r.title);
    if (!question) return [];
    const priority = asText(r.priority);
    const checkpoint: PhysicianCheckpoint = {
      id: `K_${encounterId}_${i}`,
      encounterId,
      type: "missing_info",
      title: asText(r.title) || `Checkpoint ${i + 1}`,
      prompt: question,
      status: "open",
      options: Array.isArray(r.options) ? (r.options as unknown[]).map(asText).filter(Boolean) : undefined,
      severity: priority === "critical" ? "high" : priority === "high" ? "medium" : "low"
    };
    return [checkpoint];
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

const encounterPatientMap: Record<string, string> = {
  E001: "P023",
  E002: "P041",
  E003: "P052",
  E004: "P078",
  E005: "P091"
};

export async function getConsultation(encounterId: string): Promise<Consultation> {
  // Try real Supabase data first
  const run = await getLatestScribeRun(encounterId);

  const patient = findPatient(encounterPatientMap[encounterId] ?? "P023");

  if (run?.soap_note) {
    const note = adaptSoapNote(run.soap_note, encounterId);
    const uncertaintyFlags = adaptUncertaintyFlags(run.uncertain_words, encounterId);
    const checkpoints = adaptCheckpoints(run.physician_prompts, run.physician_questions, encounterId);

    return {
      id: encounterId,
      patientId: patient.id,
      patient,
      startedAt: run.created_at,
      status: "review",
      noteFormat: "SOAP",
      consentMode: "full",
      transcript: getTranscript(encounterId),
      note,
      uncertaintyFlags,
      checkpoints,
      toolCalls: getToolCalls(encounterId),
      modelOutputs: getModelOutputs(encounterId)
    };
  }

  // Fall back to mock data
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
