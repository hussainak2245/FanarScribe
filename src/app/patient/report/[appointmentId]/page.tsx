import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PatientReportView } from "@/features/patient-side/PatientReportView";
import { getPatientReportByAppointment } from "@/lib/api/reports";

export default async function PatientReportPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;
  const report = await getPatientReportByAppointment(appointmentId);

  return (
    <DynamicPaperShell className="max-w-5xl">
      <div className="p-5">
        <PatientReportView report={report} />
      </div>
    </DynamicPaperShell>
  );
}
