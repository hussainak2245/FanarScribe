import type { Patient } from "./patient";
import type { PhysicianCheckpoint } from "./checkpoint";
import type { SoapNote } from "./soap";
import type { TranscriptLine } from "./transcript";
import type { ModelOutput, ToolCall } from "./tools";
import type { UncertaintyFlag } from "./uncertainty";

export type Consultation = {
  id: string;
  patientId: string;
  patient: Patient;
  startedAt: string;
  status: "recording" | "paused" | "review" | "finalized";
  noteFormat: SoapNote["format"];
  consentMode: "full" | "privacy" | "limited";
  transcript: TranscriptLine[];
  note: SoapNote;
  uncertaintyFlags: UncertaintyFlag[];
  checkpoints: PhysicianCheckpoint[];
  toolCalls: ToolCall[];
  modelOutputs: ModelOutput[];
};
