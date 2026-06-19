import type { PhysicianCheckpoint } from "@/types/checkpoint";
import { CheckpointCard } from "./CheckpointCard";

export function RedFlagCheckpoint({ checkpoint }: { checkpoint: PhysicianCheckpoint }) {
  return <CheckpointCard checkpoint={checkpoint} />;
}
