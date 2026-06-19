import { AlertTriangle, CircleCheck, CircleHelp } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { SignalDot } from "@/components/shared/SignalDot";
import type { UncertaintyFlag } from "@/types/uncertainty";

export function UncertaintySummary({ flags }: { flags: UncertaintyFlag[] }) {
  const high = flags.filter((flag) => flag.severity === "high").length;
  const required = flags.filter((flag) => flag.status === "physician_required").length;

  return (
    <SoftPanel className="p-4" tone="transparent">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-magenta-500">Uncertainty summary</p>
          <h3 className="mt-1 text-lg font-black text-navy-900">Margin lens</h3>
        </div>
        <SignalDot tone={required ? "magenta" : "teal"} pulse={required > 0} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-md bg-white/60 p-3">
          <CircleHelp className="h-4 w-4 text-magenta-400" aria-hidden="true" />
          <p className="mt-3 text-xl font-black text-navy-900">{required}</p>
          <p className="text-xs font-semibold text-slate-500">Need doctor</p>
        </div>
        <div className="rounded-md bg-white/60 p-3">
          <AlertTriangle className="h-4 w-4 text-ruby-500" aria-hidden="true" />
          <p className="mt-3 text-xl font-black text-navy-900">{high}</p>
          <p className="text-xs font-semibold text-slate-500">High risk</p>
        </div>
        <div className="rounded-md bg-white/60 p-3">
          <CircleCheck className="h-4 w-4 text-teal-500" aria-hidden="true" />
          <p className="mt-3 text-xl font-black text-navy-900">{flags.length - required}</p>
          <p className="text-xs font-semibold text-slate-500">Tracked</p>
        </div>
      </div>
    </SoftPanel>
  );
}
