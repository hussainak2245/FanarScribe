export type PatientReport = {
  id: string;
  appointmentId: string;
  encounterId: string;
  patientId: string;
  generatedFromApprovedNote: boolean;
  summaryArabic: string;
  medicationsArabic: string[];
  warningSignsArabic: string[];
  followUpArabic: string[];
  urgentCareArabic: string;
  doctorEditableNote?: string;
};
