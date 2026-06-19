import { AlertTriangle } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { UncertaintyTag } from "@/features/uncertainty/UncertaintyTag";
import type { UncertaintyFlag } from "@/types/uncertainty";

export function RemainingWarnings({ warnings }: { warnings: UncertaintyFlag[] }) {
  return (
    <SoftPanel className="p-4" tone="cloud">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gold-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Remaining warnings</h3>
      </div>
      <div className="space-y-2">
        {warnings.map((warning) => (
          <div key={warning.id} className="rounded-md bg-white/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-navy-900">{warning.label}</p>
              <UncertaintyTag status={warning.status} />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{warning.prompt ?? warning.text}</p>
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
