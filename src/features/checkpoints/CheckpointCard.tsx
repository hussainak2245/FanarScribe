import { AlertTriangle, CircleHelp, CheckCircle2, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingPrompt } from "@/components/shared/FloatingPrompt";
import type { PhysicianCheckpoint } from "@/types/checkpoint";

const icons = {
  ambiguous_phrase: CircleHelp,
  missing_info: MessageSquareText,
  red_flag: AlertTriangle
};

export function CheckpointCard({ checkpoint }: { checkpoint: PhysicianCheckpoint }) {
  const Icon = icons[checkpoint.type];
  const tone = checkpoint.severity === "high" ? "ruby" : checkpoint.type === "missing_info" ? "gold" : "magenta";

  return (
    <div className="rounded-md border border-navy-900/10 bg-white/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 text-magenta-500" aria-hidden="true" />
          <div>
            <p className="font-black text-navy-900">{checkpoint.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{checkpoint.prompt}</p>
          </div>
        </div>
        <Badge tone={checkpoint.status === "resolved" ? "teal" : tone}>{checkpoint.status}</Badge>
      </div>
      {checkpoint.options?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {checkpoint.options.map((option) => (
            <Button key={option} type="button" variant="secondary" size="sm">{option}</Button>
          ))}
        </div>
      ) : null}
      {checkpoint.status === "resolved" ? (
        <FloatingPrompt className="mt-3" tone="cyan">
          <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
          Resolved and ready to appear in the final note.
        </FloatingPrompt>
      ) : null}
    </div>
  );
}
