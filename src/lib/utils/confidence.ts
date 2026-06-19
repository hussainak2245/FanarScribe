import type { UncertaintyStatus } from "@/types/uncertainty";

export function confidenceLabel(score: number) {
  if (score >= 0.9) return "High";
  if (score >= 0.72) return "Moderate";
  return "Needs review";
}

export function statusLabel(status: UncertaintyStatus) {
  const labels: Record<UncertaintyStatus, string> = {
    confirmed: "Confirmed",
    likely: "Likely",
    unclear: "Needs clarification",
    inferred: "Inferred",
    missing: "Missing",
    unsupported: "Unsupported",
    physician_required: "Physician required"
  };

  return labels[status];
}

export function confidenceTone(score: number) {
  if (score >= 0.9) return "teal";
  if (score >= 0.72) return "gold";
  return "magenta";
}
