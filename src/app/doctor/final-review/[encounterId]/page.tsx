import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { FinalApprovalBar } from "@/features/consultation/FinalApprovalBar";
import { FinalNotePreview } from "@/features/reports/FinalNotePreview";
import { RemainingWarnings } from "@/features/reports/RemainingWarnings";
import { ResolvedCheckpointsList } from "@/features/reports/ResolvedCheckpointsList";
import { NoteQualityCard } from "@/features/intelligence/NoteQualityCard";
import { getConsultation } from "@/lib/api/consultations";

export default async function FinalReviewPage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  const consultation = await getConsultation(encounterId);

  return (
    <DynamicPaperShell>
      <PageHeader
        eyebrow="Final review"
        title="Physician approval manuscript"
        body="Review the final SOAP note, resolved checkpoints, and remaining warnings before export."
      />
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <FinalApprovalBar encounterId={encounterId} readiness={consultation.note.readiness} />
          <FinalNotePreview note={consultation.note} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ResolvedCheckpointsList checkpoints={consultation.checkpoints} />
          <RemainingWarnings warnings={consultation.uncertaintyFlags} />
          <NoteQualityCard readiness={consultation.note.readiness} />
        </aside>
      </div>
    </DynamicPaperShell>
  );
}
