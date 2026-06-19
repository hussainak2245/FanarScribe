import type { SoapNote } from "@/types/soap";

export const soapNotes: Record<string, SoapNote> = {
  E001: {
    id: "N001",
    encounterId: "E001",
    format: "Arabic-English Hybrid",
    readiness: 0.78,
    updatedAt: "2026-06-15T08:42:00+03:00",
    sections: {
      subjective: [
        {
          id: "C001",
          section: "subjective",
          text: "Patient reports كتمة since yesterday, described as mild chest pressure with cough.",
          evidenceText: "دكتور عندي كتمة من أمس، أحس صدري ضاغط شوي ومع السعال يزيد.",
          confidence: 0.74,
          status: "physician_required",
          reason: "Arabic phrase كتمة may indicate tightness, dyspnea, or both.",
          physicianPrompt: "Clarify whether the patient means chest tightness, shortness of breath, or both."
        },
        {
          id: "C002",
          section: "subjective",
          text: "No fever reported. Possible mild wheeze. Salbutamol used once overnight with partial improvement.",
          evidenceText: "ما في حرارة، بس يمكن صفير خفيف. استخدمت البخاخ مرة بالليل وتحسنت شوي.",
          confidence: 0.88,
          status: "likely"
        }
      ],
      objective: [
        {
          id: "C003",
          section: "objective",
          text: "SpO2 and chest exam pending during live note generation.",
          confidence: 0.52,
          status: "missing",
          reason: "Respiratory complaint requires objective oxygen saturation and wheeze assessment."
        }
      ],
      assessment: [
        {
          id: "C004",
          section: "assessment",
          text: "Likely mild asthma flare triggered by respiratory irritation; infection less likely without fever.",
          confidence: 0.7,
          status: "inferred",
          evidenceText: "No fever, mild wheeze, partial response to inhaler."
        }
      ],
      plan: [
        {
          id: "C005",
          section: "plan",
          text: "Check SpO2, auscultate chest, review inhaler technique, and consider short bronchodilator plan.",
          confidence: 0.91,
          status: "confirmed",
          evidenceText: "Doctor requested oxygen measurement and medication review."
        },
        {
          id: "C006",
          section: "plan",
          text: "Provide Arabic safety-net instructions for worsening breathlessness, chest pain, fever, or low oxygen.",
          confidence: 0.86,
          status: "likely"
        }
      ]
    }
  },
  E002: {
    id: "N002",
    encounterId: "E002",
    format: "SOAP",
    readiness: 0.84,
    updatedAt: "2026-06-15T09:15:00+03:00",
    sections: {
      subjective: [
        {
          id: "C101",
          section: "subjective",
          text: "Home blood pressure around 145/90 with occasional missed medication doses.",
          confidence: 0.92,
          status: "confirmed"
        }
      ],
      objective: [
        {
          id: "C102",
          section: "objective",
          text: "Clinic BP reading pending.",
          confidence: 0.54,
          status: "missing"
        }
      ],
      assessment: [
        {
          id: "C103",
          section: "assessment",
          text: "Suboptimally controlled hypertension, likely adherence-related.",
          confidence: 0.81,
          status: "likely"
        }
      ],
      plan: [
        {
          id: "C104",
          section: "plan",
          text: "Confirm measurement technique, reinforce daily amlodipine, and repeat readings log.",
          confidence: 0.9,
          status: "confirmed"
        }
      ]
    }
  },
  E003: {
    id: "N003",
    encounterId: "E003",
    format: "SOAP",
    readiness: 0.68,
    updatedAt: "2026-06-15T09:32:00+03:00",
    sections: {
      subjective: [
        {
          id: "C201",
          section: "subjective",
          text: "Three-day severe headache with nausea; visual symptoms denied.",
          confidence: 0.87,
          status: "likely"
        }
      ],
      objective: [
        {
          id: "C202",
          section: "objective",
          text: "Neurological exam not yet documented.",
          confidence: 0.48,
          status: "missing"
        }
      ],
      assessment: [
        {
          id: "C203",
          section: "assessment",
          text: "Migraine flare possible, but red-flag screen incomplete.",
          confidence: 0.62,
          status: "physician_required"
        }
      ],
      plan: [
        {
          id: "C204",
          section: "plan",
          text: "Complete red-flag screen and document neurological findings before finalizing.",
          confidence: 0.89,
          status: "confirmed"
        }
      ]
    }
  }
};

export function getSoapNote(encounterId: string) {
  return soapNotes[encounterId] ?? soapNotes.E001;
}
