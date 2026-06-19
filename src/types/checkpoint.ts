export type PhysicianCheckpointType = "ambiguous_phrase" | "missing_info" | "red_flag";

export type PhysicianCheckpoint = {
  id: string;
  encounterId: string;
  type: PhysicianCheckpointType;
  title: string;
  prompt: string;
  status: "open" | "resolved" | "deferred";
  options?: string[];
  linkedClaimId?: string;
  severity?: "low" | "medium" | "high";
};
