import { Send } from "lucide-react";
import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PatientInstructionPreview } from "@/features/reports/PatientInstructionPreview";
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
        action={
          <Button type="button" size="lg">
            <Send className="h-4 w-4" aria-hidden="true" />
            Send to patient
          </Button>
        }
      />
      <div className="p-5">
        <PatientInstructionPreview report={report} />
      </div>
    </DynamicPaperShell>
  );
}
