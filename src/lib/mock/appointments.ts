import type { Appointment } from "@/types/appointment";

export const appointments: Appointment[] = [
  {
    id: "A001",
    patientId: "P023",
    encounterId: "E001",
    patientName: "Haytham Ahmed",
    patientNameArabic: "",
    reason: "",
    time: "08:30",
    clinic: "Family Medicine",
    status: [],
    language: "Arabic"
  },
  {
    id: "A002",
    patientId: "P041",
    encounterId: "E002",
    patientName: "Abdullah",
    patientNameArabic: "",
    reason: "",
    time: "09:00",
    clinic: "Chronic Care",
    status: [],
    language: "Arabic"
  },
  {
    id: "A003",
    patientId: "P052",
    encounterId: "E003",
    patientName: "Farah",
    patientNameArabic: "",
    reason: "",
    time: "09:20",
    clinic: "Family Medicine",
    status: [],
    language: "Arabic"
  },
  {
    id: "A004",
    patientId: "P078",
    encounterId: "E004",
    patientName: "Jawad",
    patientNameArabic: "",
    reason: "",
    time: "10:00",
    clinic: "General Practice",
    status: [],
    language: "Arabic"
  },
];
