import type { PhysicianCheckpoint } from "@/types/checkpoint";
import type { UncertaintyFlag } from "@/types/uncertainty";

export const uncertaintyFlags: Record<string, UncertaintyFlag[]> = {
  E001: [
    {
      id: "U001",
      encounterId: "E001",
      label: "Ambiguous symptom phrase",
      text: "كتمة",
      status: "physician_required",
      confidence: 0.58,
      source: "transcript",
      prompt: "Does كتمة mean chest tightness, shortness of breath, or both?",
      evidenceText: "دكتور عندي كتمة من أمس",
      severity: "medium"
    },
    {
      id: "U002",
      encounterId: "E001",
      label: "Missing objective respiratory data",
      text: "SpO2 and chest exam",
      status: "missing",
      confidence: 0.41,
      source: "note",
      prompt: "Add oxygen saturation and wheeze findings before final approval.",
      severity: "high"
    },
    {
      id: "U003",
      encounterId: "E001",
      label: "Medication adherence unclear",
      text: "Metformin adherence",
      status: "unclear",
      confidence: 0.65,
      source: "patient_intake",
      prompt: "Confirm whether metformin is taken daily or intermittently.",
      severity: "low"
    }
  ],
  E002: [
    {
      id: "U101",
      encounterId: "E002",
      label: "Clinic BP missing",
      text: "No clinic reading entered",
      status: "missing",
      confidence: 0.48,
      source: "note",
      severity: "medium"
    }
  ],
  E003: [
    {
      id: "U201",
      encounterId: "E003",
      label: "Red-flag screen incomplete",
      text: "Severe headache",
      status: "physician_required",
      confidence: 0.5,
      source: "transcript",
      prompt: "Confirm thunderclap onset, neurological symptoms, pregnancy, fever, and trauma.",
      severity: "high"
    }
  ]
};

export const checkpoints: Record<string, PhysicianCheckpoint[]> = {
  E001: [
    {
      id: "K001",
      encounterId: "E001",
      type: "ambiguous_phrase",
      title: "Clarify كتمة",
      prompt: "Does “كتمة” mean chest tightness, shortness of breath, or both?",
      status: "open",
      options: ["Chest tightness", "Shortness of breath", "Both", "Ask again"],
      linkedClaimId: "C001",
      severity: "medium"
    },
    {
      id: "K002",
      encounterId: "E001",
      type: "missing_info",
      title: "Add objective respiratory data",
      prompt: "Enter SpO2 and chest auscultation findings before approving the note.",
      status: "open",
      options: ["SpO2 normal", "Wheeze present", "Deferred", "Escalate"],
      linkedClaimId: "C003",
      severity: "high"
    },
    {
      id: "K003",
      encounterId: "E001",
      type: "red_flag",
      title: "Respiratory safety screen",
      prompt: "Ask about chest pain, cyanosis, severe breathlessness, and inability to speak full sentences.",
      status: "resolved",
      options: ["No red flags", "Red flag present"],
      severity: "high"
    }
  ],
  E002: [
    {
      id: "K101",
      encounterId: "E002",
      type: "missing_info",
      title: "Clinic BP reading",
      prompt: "Add the clinic blood pressure before finalizing.",
      status: "open",
      severity: "medium"
    }
  ],
  E003: [
    {
      id: "K201",
      encounterId: "E003",
      type: "red_flag",
      title: "Headache red-flag screen",
      prompt: "Confirm no thunderclap onset, neuro deficit, fever, trauma, pregnancy, or anticoagulant use.",
      status: "open",
      severity: "high"
    }
  ]
};

export function getUncertaintyFlags(encounterId: string) {
  return uncertaintyFlags[encounterId] ?? uncertaintyFlags.E001;
}

export function getCheckpoints(encounterId: string) {
  return checkpoints[encounterId] ?? checkpoints.E001;
}
