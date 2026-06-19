import { Mic2 } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { TranscriptLine as TranscriptLineType } from "@/types/transcript";
import { TranscriptLine } from "./TranscriptLine";

export function TranscriptPanel({ transcript }: { transcript: TranscriptLineType[] }) {
  return (
    <SoftPanel className="p-4" tone="paper">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic2 className="h-4 w-4 text-coral-500" aria-hidden="true" />
          <h2 className="text-lg font-black text-navy-900">Live transcript</h2>
        </div>
        <p className="text-xs font-black uppercase text-coral-500">Recording</p>
      </div>
      <div className="space-y-3">
        {transcript.map((line) => (
          <TranscriptLine key={line.id} line={line} />
        ))}
      </div>
    </SoftPanel>
  );
}
