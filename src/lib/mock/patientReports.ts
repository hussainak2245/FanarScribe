import type { PatientReport } from "@/types/report";

export const patientReports: Record<string, PatientReport> = {
  E001: {
    id: "PR001",
    appointmentId: "A001",
    encounterId: "E001",
    patientId: "P023",
    generatedFromApprovedNote: true,
    summaryArabic: "راجعتِ اليوم بسبب كتمة وسعال خفيف. الخطة تركز على متابعة التنفس واستخدام البخاخ بالطريقة الصحيحة.",
    medicationsArabic: [
      "استخدمي بخاخ السالبوتامول حسب تعليمات الطبيبة عند اللزوم.",
      "استمري على الميتفورمين كما هو موصوف، وأخبري الطبيبة إذا كنتِ تنسين الجرعات."
    ],
    warningSignsArabic: [
      "ضيق نفس شديد أو عدم القدرة على الكلام بجمل كاملة.",
      "ألم صدر قوي أو ازرقاق الشفاه.",
      "حرارة مستمرة أو تدهور السعال."
    ],
    followUpArabic: [
      "راجعي العيادة إذا لم تتحسن الأعراض خلال 48 ساعة.",
      "أحضري قراءات السكر وقائمة الأدوية في الزيارة القادمة."
    ],
    urgentCareArabic: "اذهبي للطوارئ فورا إذا زادت الكتمة أو ظهر ألم صدر أو نقص الأكسجين.",
    doctorEditableNote: "Generated from physician-approved note."
  }
};

export function getPatientReport(encounterId: string) {
  return patientReports[encounterId] ?? patientReports.E001;
}
