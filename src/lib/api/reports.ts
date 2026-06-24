import { getPatientReport } from "@/lib/mock/patientReports";
import { mockRequest } from "./client";

export async function getPatientReportByAppointment(appointmentId: string) {
  const report = getPatientReport("E001");
  return mockRequest({ ...report, appointmentId });
}
