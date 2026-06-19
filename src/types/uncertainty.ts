export type UncertaintyStatus =
  | "confirmed"
  | "likely"
  | "unclear"
  | "inferred"
  | "missing"
  | "unsupported"
  | "physician_required";

export type UncertaintyFlag = {
  id: string;
  encounterId: string;
  label: string;
  text: string;
  status: UncertaintyStatus;
  confidence: number;
  source: "transcript" | "note" | "tool" | "patient_intake";
  prompt?: string;
  evidenceText?: string;
  severity?: "low" | "medium" | "high";
};
