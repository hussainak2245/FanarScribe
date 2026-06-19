import type { UncertaintyStatus } from "./uncertainty";

export type SoapSectionKey = "subjective" | "objective" | "assessment" | "plan";

export type ClinicalClaim = {
  id: string;
  section: SoapSectionKey;
  text: string;
  evidenceText?: string;
  confidence: number;
  status: UncertaintyStatus;
  reason?: string;
  physicianPrompt?: string;
};

export type SoapNote = {
  id: string;
  encounterId: string;
  format: "SOAP" | "Focused SOAP" | "Arabic-English Hybrid";
  sections: Record<SoapSectionKey, ClinicalClaim[]>;
  readiness: number;
  updatedAt: string;
};
