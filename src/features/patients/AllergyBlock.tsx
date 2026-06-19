import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { Allergy } from "@/types/patient";

export function AllergyBlock({ allergies }: { allergies: Allergy[] }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-coral-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Allergies</h3>
      </div>
      {allergies.length ? (
        <div className="space-y-2">
          {allergies.map((allergy) => (
            <div key={allergy.substance} className="rounded-md bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-navy-900">{allergy.substance}</p>
                <Badge tone={allergy.severity === "severe" ? "ruby" : "gold"}>{allergy.severity}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{allergy.reaction}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No allergies recorded.</p>
      )}
    </SoftPanel>
  );
}
