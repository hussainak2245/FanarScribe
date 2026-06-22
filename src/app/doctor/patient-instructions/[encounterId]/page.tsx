import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientInstructionPreview } from "@/features/reports/PatientInstructionPreview";
import { SendInstructionsButton } from "@/features/reports/SendInstructionsButton";
import { generatePatientReport } from "@/lib/api/reports";

export default async function PatientInstructionsPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const report = await generatePatientReport(encounterId);

  return (
    <DynamicPaperShell>
      <PageHeader
        eyebrow="Patient instructions"
        title="Arabic discharge page"
        body="Generated from the physician-approved note and editable before sending."
        action={<SendInstructionsButton encounterId={encounterId} />}
      />
      <div className="p-5">
        <PatientInstructionPreview report={report} />
      </div>
    </DynamicPaperShell>
  );
}
