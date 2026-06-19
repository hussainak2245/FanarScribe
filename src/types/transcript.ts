export type TranscriptLine = {
  id: string;
  encounterId: string;
  speaker: "Doctor" | "Patient" | "Nurse";
  timestamp: string;
  text: string;
  language: "ar" | "en" | "mixed";
  uncertainTerms?: {
    term: string;
    prompt: string;
  }[];
};
