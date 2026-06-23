import { getPatientReport } from "@/lib/mock/patientReports";
import { getLatestScribeRun } from "@/lib/supabase/server";
import { mockRequest } from "./client";
import type { PatientReport } from "@/types/report";

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    for (const k of ["cleaned_text", "text", "content", "note", "value"]) {
      if (typeof r[k] === "string") return r[k] as string;
    }
    return Object.entries(r).map(([k, v]) => { const t = asText(v); return t ? `${k.replace(/_/g, " ")}: ${t}` : ""; }).filter(Boolean).join("\n");
  }
  return "";
}

function extractSoapText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return asText(raw);
  const r = raw as Record<string, unknown>;
  const source = (r.sections && typeof r.sections === "object") ? (r.sections as Record<string, unknown>) : r;
  const sections = ["subjective", "objective", "assessment", "plan"]
    .map((k) => { const t = asText(source[k]); return t ? `${k.toUpperCase()}\n${t}` : ""; })
    .filter(Boolean);
  return sections.length > 0 ? sections.join("\n\n") : asText(raw);
}

export async function generatePatientReport(encounterId: string): Promise<PatientReport> {
  const run = await getLatestScribeRun(encounterId);
  const base = getPatientReport(encounterId);

  if (run?.soap_note) {
    const soapText = extractSoapText(run.soap_note);
    return {
      ...base,
      encounterId,
      // Pre-populate with the actual SOAP note for the doctor to edit before sending.
      // Full Arabic auto-generation from the note requires a backend /patient-instructions/generate endpoint.
      doctorEditableNote: soapText || base.doctorEditableNote
    };
  }

  return mockRequest(base, 320);
}

export async function getPatientReportByAppointment(appointmentId: string) {
  const report = getPatientReport("E001");
  return mockRequest({ ...report, appointmentId });
}
