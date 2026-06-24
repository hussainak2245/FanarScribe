export const routes = {
  doctorDashboard: "/doctor/dashboard",
  patient: (patientId: string) => `/doctor/patient/${patientId}`,
  consultation: (encounterId: string) => `/doctor/consultation/${encounterId}`,
  finalReview: (encounterId: string) => `/doctor/final-review/${encounterId}`,
  patientIntake: (appointmentId: string) => `/patient/intake/${appointmentId}`,
  patientReport: (appointmentId: string) => `/patient/report/${appointmentId}`
};
