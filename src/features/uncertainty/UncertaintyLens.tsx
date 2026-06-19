import { SoftPanel } from "@/components/shared/SoftPanel";
import { FloatingPrompt } from "@/components/shared/FloatingPrompt";
import type { UncertaintyFlag } from "@/types/uncertainty";
import { ConfidenceBreakdown } from "./ConfidenceBreakdown";
import { UncertaintyTag } from "./UncertaintyTag";

export function UncertaintyLens({ flags }: { flags: UncertaintyFlag[] }) {
  return (
    <SoftPanel className="p-4" tone="paper">
      <div className="mb-4">
        <p className="text-xs font-black uppercase text-magenta-500">Uncertainty lens</p>
        <h3 className="mt-1 text-lg font-black text-navy-900">Claims that need a margin note</h3>
      </div>
      <div className="space-y-3">
        {flags.map((flag) => (
          <div key={flag.id} className="rounded-md border border-navy-900/10 bg-white/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy-900">{flag.label}</p>
              <UncertaintyTag status={flag.status} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{flag.text}</p>
            {flag.prompt ? <FloatingPrompt className="mt-3" tone={flag.severity === "high" ? "gold" : "magenta"}>{flag.prompt}</FloatingPrompt> : null}
            <ConfidenceBreakdown confidence={flag.confidence} />
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
