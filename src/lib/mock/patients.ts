import type { Patient } from "@/types/patient";

export const patients: Patient[] = [
  {
    id: "P023",
    name: "Mariam Al-Kuwari",
    nameArabic: "مريم الكواري",
    age: 42,
    sex: "Female",
    languagePreference: "Arabic + English",
    phone: "+974 55 231 884",
    chronicConditions: ["Type 2 diabetes", "Mild asthma", "Vitamin D deficiency"],
    medications: [
      { name: "Metformin", dose: "500 mg", frequency: "twice daily", adherence: "partial" },
      { name: "Salbutamol inhaler", dose: "100 mcg", frequency: "as needed", adherence: "unknown" }
    ],
    allergies: [{ substance: "Penicillin", reaction: "Rash and facial swelling", severity: "moderate" }],
    previousVisits: [
      {
        date: "2026-05-11",
        reason: "Cough and wheeze",
        summary: "Improved after inhaler use. Spirometry deferred because symptoms were mild."
      },
      {
        date: "2026-03-08",
        reason: "Diabetes follow-up",
        summary: "HbA1c 7.8%. Lifestyle counseling and metformin adherence discussed."
      }
    ],
    reports: [
      {
        id: "R-LAB-23",
        type: "lab",
        title: "HbA1c and lipids",
        date: "2026-05-26",
        summary: "HbA1c 7.6%, LDL 3.1 mmol/L. Kidney function normal.",
        abnormal: true
      },
      {
        id: "R-IMG-23",
        type: "imaging",
        title: "Chest X-ray",
        date: "2026-05-12",
        summary: "No focal consolidation. Mild hyperinflation noted."
      }
    ],
    preVisitSummary:
      "Patient reports كتمة from yesterday with intermittent cough. Needs clarification whether this is chest tightness, breathlessness, or both.",
    consentStatus: "signed",
    riskSignals: ["Respiratory complaint", "Diabetes medication adherence"]
  },
  {
    id: "P041",
    name: "Nasser Al-Mansoori",
    nameArabic: "ناصر المنصوري",
    age: 58,
    sex: "Male",
    languagePreference: "Arabic",
    phone: "+974 66 884 210",
    chronicConditions: ["Hypertension", "Dyslipidemia"],
    medications: [
      { name: "Amlodipine", dose: "5 mg", frequency: "daily", adherence: "good" },
      { name: "Atorvastatin", dose: "20 mg", frequency: "nightly", adherence: "partial" }
    ],
    allergies: [],
    previousVisits: [
      {
        date: "2026-04-02",
        reason: "Blood pressure review",
        summary: "Home readings borderline. Salt intake and exercise plan reviewed."
      }
    ],
    reports: [
      {
        id: "R-LAB-41",
        type: "lab",
        title: "Renal profile",
        date: "2026-04-15",
        summary: "Creatinine 78 umol/L, eGFR >90, potassium normal."
      }
    ],
    preVisitSummary: "Follow-up for blood pressure and intermittent headaches after missed doses.",
    consentStatus: "signed",
    riskSignals: ["Medication adherence"]
  },
  {
    id: "P052",
    name: "Layla Hassan",
    nameArabic: "ليلى حسن",
    age: 31,
    sex: "Female",
    languagePreference: "Arabic + English",
    phone: "+974 33 450 991",
    chronicConditions: ["Migraine"],
    medications: [{ name: "Sumatriptan", dose: "50 mg", frequency: "as needed", adherence: "good" }],
    allergies: [{ substance: "Ibuprofen", reaction: "Gastritis flare", severity: "mild" }],
    previousVisits: [
      {
        date: "2026-02-20",
        reason: "Migraine flare",
        summary: "No neurological deficit. Trigger diary recommended."
      }
    ],
    reports: [
      {
        id: "R-IMG-52",
        type: "imaging",
        title: "MRI brain",
        date: "2025-11-04",
        summary: "No acute intracranial abnormality."
      }
    ],
    preVisitSummary: "Reports stronger headache for three days with nausea. Needs red-flag screen.",
    consentStatus: "limited",
    riskSignals: ["Headache red-flag screen"]
  },
  {
    id: "P078",
    name: "Omar Saleh",
    nameArabic: "عمر صالح",
    age: 9,
    sex: "Male",
    languagePreference: "Arabic",
    phone: "+974 77 120 447",
    chronicConditions: ["Eczema"],
    medications: [{ name: "Hydrocortisone cream", dose: "1%", frequency: "thin layer twice daily", adherence: "partial" }],
    allergies: [{ substance: "Peanuts", reaction: "Wheezing", severity: "severe" }],
    previousVisits: [
      {
        date: "2026-05-01",
        reason: "Eczema flare",
        summary: "Emollient plan reinforced. Avoidance triggers discussed."
      }
    ],
    reports: [
      {
        id: "R-GEN-78",
        type: "genetics",
        title: "Atopy risk panel",
        date: "2026-01-15",
        summary: "Family-history aligned atopy risk. No medication guidance generated."
      }
    ],
    preVisitSummary: "Parent reports itchy rash behind knees and possible food trigger.",
    consentStatus: "pending",
    riskSignals: ["Severe food allergy"]
  },
  {
    id: "P091",
    name: "Sara Mahmoud",
    nameArabic: "سارة محمود",
    age: 67,
    sex: "Female",
    languagePreference: "Arabic + English",
    phone: "+974 50 779 612",
    chronicConditions: ["Osteoarthritis", "Chronic kidney disease stage 3"],
    medications: [
      { name: "Paracetamol", dose: "1 g", frequency: "up to three times daily", adherence: "good" },
      { name: "Calcium/Vitamin D", dose: "500 mg/400 IU", frequency: "daily", adherence: "unknown" }
    ],
    allergies: [{ substance: "Diclofenac", reaction: "Worsened kidney function", severity: "moderate" }],
    previousVisits: [
      {
        date: "2026-04-28",
        reason: "Knee pain",
        summary: "Exercise handout given. NSAIDs avoided due to CKD."
      }
    ],
    reports: [
      {
        id: "R-LAB-91",
        type: "lab",
        title: "Kidney function",
        date: "2026-05-18",
        summary: "eGFR 47, potassium 4.7, urine ACR mildly raised.",
        abnormal: true
      }
    ],
    preVisitSummary: "Knee pain review with request for safer analgesia.",
    consentStatus: "signed",
    riskSignals: ["CKD medication caution"]
  }
];

export function findPatient(patientId: string) {
  return patients.find((patient) => patient.id === patientId) ?? patients[0];
}
