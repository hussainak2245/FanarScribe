import { Pill } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { Medication } from "@/types/patient";

export function MedicationList({ medications }: { medications: Medication[] }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="mb-3 flex items-center gap-2">
        <Pill className="h-4 w-4 text-cyan-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Medications</h3>
      </div>
      <div className="space-y-2">
        {medications.map((medication) => (
          <div key={medication.name} className="rounded-md bg-white/60 p-3">
            <p className="font-semibold text-navy-900">{medication.name}</p>
            <p className="text-sm text-slate-500">
              {medication.dose} · {medication.frequency}
            </p>
            {medication.adherence ? (
              <p className="mt-1 text-xs font-semibold text-magenta-500">Adherence: {medication.adherence}</p>
            ) : null}
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
