export type Medication = {
  name: string;
  dose: string;
  frequency: string;
  adherence?: "good" | "partial" | "unknown";
};

export type Allergy = {
  substance: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe";
};

export type ReportPreview = {
  id: string;
  type: "lab" | "imaging" | "genetics";
  title: string;
  date: string;
  summary: string;
  abnormal?: boolean;
};

export type VisitSummary = {
  date: string;
  reason: string;
  summary: string;
};

export type Patient = {
  id: string;
  name: string;
  nameArabic: string;
  age: number;
  sex: "Female" | "Male";
  languagePreference: "Arabic" | "English" | "Arabic + English";
  phone: string;
  chronicConditions: string[];
  medications: Medication[];
  allergies: Allergy[];
  previousVisits: VisitSummary[];
  reports: ReportPreview[];
  preVisitSummary: string;
  consentStatus: "signed" | "pending" | "limited";
  riskSignals: string[];
};
