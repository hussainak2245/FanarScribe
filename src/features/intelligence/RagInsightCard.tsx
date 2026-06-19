import { BookOpenCheck } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { ToolCall } from "@/types/tools";

export function RagInsightCard({ call }: { call?: ToolCall }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="flex items-center gap-2">
        <BookOpenCheck className="h-4 w-4 text-teal-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">RAG insight</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {call?.output ?? "RAG guideline retrieved: Respiratory complaint checklist."}
      </p>
    </SoftPanel>
  );
}
