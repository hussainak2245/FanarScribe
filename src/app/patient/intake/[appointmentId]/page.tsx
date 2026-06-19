import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PatientIntakeForm } from "@/features/patient-side/PatientIntakeForm";

export default async function PatientIntakePage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params;

  return (
    <DynamicPaperShell className="max-w-5xl">
      <div className="p-5">
        <PatientIntakeForm appointmentId={appointmentId} />
      </div>
    </DynamicPaperShell>
  );
}
