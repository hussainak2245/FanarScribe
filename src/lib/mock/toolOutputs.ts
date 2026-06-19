import type { ModelOutput, ToolCall } from "@/types/tools";

export const toolCalls: Record<string, ToolCall[]> = {
  E001: [
    {
      id: "TOOL001",
      encounterId: "E001",
      toolName: "RAG guideline retrieval",
      status: "completed",
      input: "Respiratory complaint checklist",
      output: "Retrieved asthma flare checklist and safety-net guidance.",
      timestamp: "08:39"
    },
    {
      id: "TOOL002",
      encounterId: "E001",
      toolName: "Diabetes risk model",
      status: "skipped",
      input: "Risk estimate",
      output: "Model skipped: missing HbA1c trend and LDL update.",
      timestamp: "08:40"
    },
    {
      id: "TOOL003",
      encounterId: "E001",
      toolName: "Safety scan",
      status: "warning",
      input: "Respiratory symptom note",
      output: "Respiratory complaint detected; ask about SpO2 and wheezing.",
      timestamp: "08:41"
    }
  ]
};

export const modelOutputs: Record<string, ModelOutput[]> = {
  E001: [
    {
      id: "MO001",
      encounterId: "E001",
      modelName: "SAJIL SOAP composer",
      label: "Generated SOAP draft",
      summary: "Structured respiratory complaint into SOAP with two physician checkpoints.",
      confidence: 0.82,
      status: "needs_review"
    },
    {
      id: "MO002",
      encounterId: "E001",
      modelName: "Uncertainty lens",
      label: "Claim confidence scoring",
      summary: "Detected ambiguous Arabic phrase and missing objective respiratory findings.",
      confidence: 0.76,
      status: "needs_review"
    }
  ]
};

export function getToolCalls(encounterId: string) {
  return toolCalls[encounterId] ?? toolCalls.E001;
}

export function getModelOutputs(encounterId: string) {
  return modelOutputs[encounterId] ?? modelOutputs.E001;
}
