import { appointments } from "@/lib/mock/appointments";
import { findPatient, patients } from "@/lib/mock/patients";
import { mockRequest } from "./client";

export async function getAppointments() {
  return mockRequest(appointments);
}

export async function getPatients() {
  return mockRequest(patients);
}

export async function getPatient(patientId: string) {
  return mockRequest(findPatient(patientId));
}
