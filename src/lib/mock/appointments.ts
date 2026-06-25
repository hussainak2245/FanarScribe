import type { Appointment } from "@/types/appointment";

export const appointments: Appointment[] = [
  {
    id: "A001",
    patientId: "P023",
    encounterId: "E001",
    patientName: "Mariam Al-Kuwari",
    patientNameArabic: "مريم الكواري",
    reason: "كتمة and cough",
    time: "08:30",
    clinic: "Family Medicine 2",
    status: ["pre-consultation available", "urgent flag"],
    language: "Arabic + English"
  },
  {
    id: "A002",
    patientId: "P041",
    encounterId: "E002",
    patientName: "Nasser Al-Mansoori",
    patientNameArabic: "ناصر المنصوري",
    reason: "Blood pressure follow-up",
    time: "09:00",
    clinic: "Chronic Care",
    status: ["follow-up"],
    language: "Arabic"
  },
  {
    id: "A003",
    patientId: "P052",
    encounterId: "E003",
    patientName: "Layla Hassan",
    patientNameArabic: "ليلى حسن",
    reason: "Migraine review",
    time: "09:20",
    clinic: "Family Medicine 1",
    status: ["pre-consultation available"],
    language: "Arabic + English"
  },
  {
    id: "A004",
    patientId: "P078",
    encounterId: "E004",
    patientName: "Omar Saleh",
    patientNameArabic: "عمر صالح",
    reason: "Eczema flare",
    time: "10:00",
    clinic: "Pediatrics",
    status: ["ready"],
    language: "Arabic"
  },
];
