import type { PhysicianCheckpoint } from "@/types/checkpoint";
import { CheckpointCard } from "./CheckpointCard";

export function MissingInfoCheckpoint({ checkpoint }: { checkpoint: PhysicianCheckpoint }) {
  return <CheckpointCard checkpoint={checkpoint} />;
}
