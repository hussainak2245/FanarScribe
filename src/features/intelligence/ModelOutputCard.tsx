import { BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ModelOutput } from "@/types/tools";

export function ModelOutputCard({ output }: { output: ModelOutput }) {
  return (
    <div className="rounded-md bg-white/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-navy-900">
          <BrainCircuit className="h-4 w-4 text-magenta-400" aria-hidden="true" />
          {output.label}
        </p>
        <Badge tone={output.status === "ready" ? "teal" : "magenta"}>{output.status.replace("_", " ")}</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{output.summary}</p>
      <div className="mt-3">
        <Progress value={output.confidence * 100} />
      </div>
    </div>
  );
}
