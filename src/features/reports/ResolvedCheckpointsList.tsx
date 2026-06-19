import { CheckCircle2 } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { PhysicianCheckpoint } from "@/types/checkpoint";

export function ResolvedCheckpointsList({ checkpoints }: { checkpoints: PhysicianCheckpoint[] }) {
  const resolved = checkpoints.filter((checkpoint) => checkpoint.status === "resolved");

  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-teal-500" aria-hidden="true" />
        <h3 className="text-sm font-black text-navy-900">Resolved checkpoints</h3>
      </div>
      <div className="space-y-2">
        {resolved.map((checkpoint) => (
          <p key={checkpoint.id} className="rounded-md bg-white/60 p-3 text-sm font-semibold text-slate-700">
            {checkpoint.title}
          </p>
        ))}
        {!resolved.length ? <p className="text-sm text-slate-500">No checkpoints resolved yet.</p> : null}
      </div>
    </SoftPanel>
  );
}
