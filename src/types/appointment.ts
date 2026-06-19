export type AppointmentStatus =
  | "pre-consultation available"
  | "follow-up"
  | "pending note"
  | "urgent flag"
  | "ready";

export type Appointment = {
  id: string;
  patientId: string;
  encounterId: string;
  patientName: string;
  patientNameArabic: string;
  reason: string;
  time: string;
  clinic: string;
  status: AppointmentStatus[];
  language: "Arabic" | "English" | "Arabic + English";
};
