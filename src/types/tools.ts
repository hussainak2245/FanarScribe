export type ToolCall = {
  id: string;
  encounterId: string;
  toolName: string;
  status: "completed" | "skipped" | "warning";
  input: string;
  output: string;
  timestamp: string;
};

export type ModelOutput = {
  id: string;
  encounterId: string;
  modelName: string;
  label: string;
  summary: string;
  confidence: number;
  status: "ready" | "needs_review" | "blocked";
};
