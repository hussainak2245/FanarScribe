import { Progress } from "@/components/ui/progress";
import { confidenceLabel } from "@/lib/utils/confidence";

export function ConfidenceBreakdown({
  confidence,
  evidenceScore = confidence,
  completenessScore = Math.max(0.35, confidence - 0.12)
}: {
  confidence: number;
  evidenceScore?: number;
  completenessScore?: number;
}) {
  const rows = [
    ["Claim confidence", confidence],
    ["Evidence support", evidenceScore],
    ["Completeness", completenessScore]
  ] as const;

  return (
    <div className="mt-3 space-y-3">
      {rows.map(([label, score]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <span>{label}</span>
            <span>{confidenceLabel(score)}</span>
          </div>
          <Progress value={score * 100} />
        </div>
      ))}
    </div>
  );
}
