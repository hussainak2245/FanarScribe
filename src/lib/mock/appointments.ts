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
  {
    id: "A005",
    patientId: "P091",
    encounterId: "E005",
    patientName: "Sara Mahmoud",
    patientNameArabic: "سارة محمود",
    reason: "Knee pain review",
    time: "10:25",
    clinic: "Family Medicine 3",
    status: ["follow-up"],
    language: "Arabic + English"
  },
  {
    id: "A006",
    patientId: "P023",
    encounterId: "E006",
    patientName: "Mariam Al-Kuwari",
    patientNameArabic: "مريم الكواري",
    reason: "Pending respiratory note",
    time: "11:10",
    clinic: "Virtual Follow-up",
    status: ["pending note"],
    language: "Arabic + English"
  },
  {
    id: "A007",
    patientId: "P041",
    encounterId: "E007",
    patientName: "Nasser Al-Mansoori",
    patientNameArabic: "ناصر المنصوري",
    reason: "Medication refill",
    time: "11:40",
    clinic: "Chronic Care",
    status: ["ready"],
    language: "Arabic"
  },
  {
    id: "A008",
    patientId: "P052",
    encounterId: "E008",
    patientName: "Layla Hassan",
    patientNameArabic: "ليلى حسن",
    reason: "Headache red-flag screen",
    time: "12:05",
    clinic: "Family Medicine 1",
    status: ["urgent flag"],
    language: "Arabic + English"
  },
  {
    id: "A009",
    patientId: "P091",
    encounterId: "E009",
    patientName: "Sara Mahmoud",
    patientNameArabic: "سارة محمود",
    reason: "Lab review",
    time: "12:30",
    clinic: "Family Medicine 3",
    status: ["pre-consultation available"],
    language: "Arabic + English"
  },
  {
    id: "A010",
    patientId: "P078",
    encounterId: "E010",
    patientName: "Omar Saleh",
    patientNameArabic: "عمر صالح",
    reason: "School allergy form",
    time: "13:10",
    clinic: "Pediatrics",
    status: ["pending note"],
    language: "Arabic"
  },
  {
    id: "A011",
    patientId: "P041",
    encounterId: "E011",
    patientName: "Nasser Al-Mansoori",
    patientNameArabic: "ناصر المنصوري",
    reason: "Home BP readings",
    time: "13:45",
    clinic: "Nurse-led review",
    status: ["follow-up"],
    language: "Arabic"
  },
  {
    id: "A012",
    patientId: "P023",
    encounterId: "E012",
    patientName: "Mariam Al-Kuwari",
    patientNameArabic: "مريم الكواري",
    reason: "Diabetes advice",
    time: "14:15",
    clinic: "Chronic Care",
    status: ["ready"],
    language: "Arabic + English"
  }
];
