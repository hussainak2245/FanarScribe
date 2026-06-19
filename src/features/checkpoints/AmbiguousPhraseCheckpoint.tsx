import type { PhysicianCheckpoint } from "@/types/checkpoint";
import { CheckpointCard } from "./CheckpointCard";

export function AmbiguousPhraseCheckpoint({ checkpoint }: { checkpoint: PhysicianCheckpoint }) {
  return <CheckpointCard checkpoint={checkpoint} />;
}
