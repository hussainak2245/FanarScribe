import { Quote } from "lucide-react";

export function EvidenceLink({ evidence }: { evidence?: string }) {
  if (!evidence) return null;

  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-cyan-500 transition hover:text-navy-900">
        <Quote className="h-3.5 w-3.5" aria-hidden="true" />
        Evidence
      </summary>
      <p className="arabic-text mt-2 rounded-md bg-cyan-400/10 px-3 py-2 text-sm leading-6 text-slate-700">{evidence}</p>
    </details>
  );
}
