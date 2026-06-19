import { ClipboardCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SoftPanel } from "@/components/shared/SoftPanel";

export function NoteQualityCard({ readiness }: { readiness: number }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-teal-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Note quality</h3>
      </div>
      <Progress value={readiness * 100} />
      <p className="mt-2 text-sm font-semibold text-slate-500">{Math.round(readiness * 100)}% completeness</p>
    </SoftPanel>
  );
}
