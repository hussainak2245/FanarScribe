import { ClipboardList } from "lucide-react";
import { FloatingPrompt } from "@/components/shared/FloatingPrompt";
import { SoftPanel } from "@/components/shared/SoftPanel";

export function PreVisitSummary({ summary }: { summary: string }) {
  return (
    <SoftPanel className="p-4" tone="cloud">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-teal-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Pre-consultation summary</h3>
      </div>
      <p className="text-sm leading-6 text-slate-700">{summary}</p>
      {summary.includes("كتمة") ? (
        <FloatingPrompt className="mt-4" tone="magenta">
          <span className="font-semibold">كتمة</span> needs physician confirmation before the note becomes final.
        </FloatingPrompt>
      ) : null}
    </SoftPanel>
  );
}
