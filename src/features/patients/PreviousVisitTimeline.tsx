import { History } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { formatDate } from "@/lib/utils/formatDate";
import type { VisitSummary } from "@/types/patient";

export function PreviousVisitTimeline({ visits }: { visits: VisitSummary[] }) {
  return (
    <SoftPanel className="p-4" tone="paper">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-plum-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Previous visits</h3>
      </div>
      <div className="space-y-4">
        {visits.map((visit) => (
          <div key={`${visit.date}-${visit.reason}`} className="border-l-2 border-magenta-400/20 pl-4">
            <p className="text-xs font-black uppercase text-magenta-500">{formatDate(visit.date)}</p>
            <p className="mt-1 font-semibold text-navy-900">{visit.reason}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{visit.summary}</p>
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
