import type { ReactNode } from "react";
import { containsArabic } from "@/lib/utils/arabic";
import { Badge } from "@/components/ui/badge";
import type { TranscriptLine as TranscriptLineType } from "@/types/transcript";

export function TranscriptLine({ line }: { line: TranscriptLineType }) {
  let rendered: ReactNode = line.text;

  for (const uncertain of line.uncertainTerms ?? []) {
    const [before, after] = line.text.split(uncertain.term);
    rendered = (
      <>
        {before}
        <span className="soft-underline font-black text-magenta-500" title={uncertain.prompt}>
          {uncertain.term}
        </span>
        {after}
      </>
    );
  }

  return (
    <div className="grid gap-3 rounded-md bg-white/60 p-3 sm:grid-cols-[76px_1fr]">
      <div>
        <p className="text-xs font-black text-slate-400">{line.timestamp}</p>
        <Badge tone={line.speaker === "Doctor" ? "cyan" : "coral"}>{line.speaker}</Badge>
      </div>
      <p className={containsArabic(line.text) ? "arabic-text text-base leading-8 text-navy-900" : "text-base leading-8 text-navy-900"}>
        {rendered}
      </p>
    </div>
  );
}
