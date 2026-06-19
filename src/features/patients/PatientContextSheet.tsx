import { PatientSnapshot } from "./PatientSnapshot";
import { PreVisitSummary } from "./PreVisitSummary";
import { MedicationList } from "./MedicationList";
import { AllergyBlock } from "./AllergyBlock";
import type { Patient } from "@/types/patient";

export function PatientContextSheet({ patient, compact = false }: { patient: Patient; compact?: boolean }) {
  return (
    <div className="space-y-4">
      <PatientSnapshot patient={patient} compact={compact} />
      <PreVisitSummary summary={patient.preVisitSummary} />
      <MedicationList medications={patient.medications} />
      <AllergyBlock allergies={patient.allergies} />
    </div>
  );
}
