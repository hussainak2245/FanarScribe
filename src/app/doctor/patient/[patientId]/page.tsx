import Link from "next/link";
import { Mic2 } from "lucide-react";
import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConsentPrivacyPanel } from "@/features/consultation/ConsentPrivacyPanel";
import { PatientSnapshot } from "@/features/patients/PatientSnapshot";
import { MedicationList } from "@/features/patients/MedicationList";
import { AllergyBlock } from "@/features/patients/AllergyBlock";
import { PreviousVisitTimeline } from "@/features/patients/PreviousVisitTimeline";
import { PreVisitSummary } from "@/features/patients/PreVisitSummary";
import { LabReportPreview } from "@/features/patients/LabReportPreview";
import { ImagingReportPreview } from "@/features/patients/ImagingReportPreview";
import { GeneticsReportPreview } from "@/features/patients/GeneticsReportPreview";
import { noteFormats } from "@/lib/constants/noteFormats";
import { routes } from "@/lib/constants/routes";
import { getPatient } from "@/lib/api/patients";

export default async function PatientContextPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await getPatient(patientId);

  return (
    <DynamicPaperShell>
      <PageHeader
        eyebrow="Patient context"
        title={patient.name}
        body="Review the patient manuscript before starting the scribe."
        action={
          <Link className={buttonVariants({ variant: "primary", size: "lg" })} href={routes.consultation("E001")}>
            <Mic2 className="h-4 w-4" aria-hidden="true" />
            Start Scribe
          </Link>
        }
      />
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <PatientSnapshot patient={patient} />
          <PreVisitSummary summary={patient.preVisitSummary} />
          <SoftPanel className="p-4" tone="mist">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-magenta-500">Note format</p>
                <h2 className="mt-1 text-lg font-black text-navy-900">Clinical manuscript style</h2>
              </div>
              <Select defaultValue="Arabic-English Hybrid" aria-label="Note format">
                {noteFormats.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </Select>
            </div>
          </SoftPanel>
          <div className="grid gap-4 md:grid-cols-2">
            {patient.reports.map((report) => {
              if (report.type === "lab") return <LabReportPreview key={report.id} report={report} />;
              if (report.type === "imaging") return <ImagingReportPreview key={report.id} report={report} />;
              return <GeneticsReportPreview key={report.id} report={report} />;
            })}
          </div>
          <PreviousVisitTimeline visits={patient.previousVisits} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ConsentPrivacyPanel patient={patient} />
          <MedicationList medications={patient.medications} />
          <AllergyBlock allergies={patient.allergies} />
        </aside>
      </div>
    </DynamicPaperShell>
  );
}
