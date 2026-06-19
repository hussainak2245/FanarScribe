import { SoftPanel } from "@/components/shared/SoftPanel";
import type { PhysicianCheckpoint } from "@/types/checkpoint";
import { AmbiguousPhraseCheckpoint } from "./AmbiguousPhraseCheckpoint";
import { MissingInfoCheckpoint } from "./MissingInfoCheckpoint";
import { RedFlagCheckpoint } from "./RedFlagCheckpoint";

export function CheckpointPanel({ checkpoints }: { checkpoints: PhysicianCheckpoint[] }) {
  return (
    <SoftPanel className="p-4" tone="cloud">
      <div className="mb-4">
        <p className="text-xs font-black uppercase text-gold-500">Physician checkpoints</p>
        <h3 className="mt-1 text-lg font-black text-navy-900">Questions before finalizing</h3>
      </div>
      <div className="space-y-3">
        {checkpoints.map((checkpoint) => {
          if (checkpoint.type === "ambiguous_phrase") {
            return <AmbiguousPhraseCheckpoint key={checkpoint.id} checkpoint={checkpoint} />;
          }
          if (checkpoint.type === "missing_info") {
            return <MissingInfoCheckpoint key={checkpoint.id} checkpoint={checkpoint} />;
          }
          return <RedFlagCheckpoint key={checkpoint.id} checkpoint={checkpoint} />;
        })}
      </div>
    </SoftPanel>
  );
}
