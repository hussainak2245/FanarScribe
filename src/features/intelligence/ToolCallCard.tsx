import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ToolCall } from "@/types/tools";

export function ToolCallCard({ call }: { call: ToolCall }) {
  const tone = call.status === "completed" ? "teal" : call.status === "warning" ? "gold" : "plum";

  return (
    <div className="rounded-md bg-white/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-navy-900">
          <Wrench className="h-4 w-4 text-cyan-500" aria-hidden="true" />
          {call.toolName}
        </p>
        <Badge tone={tone}>{call.status}</Badge>
      </div>
      <p className="mt-2 text-xs font-black uppercase text-slate-400">{call.input}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{call.output}</p>
    </div>
  );
}
