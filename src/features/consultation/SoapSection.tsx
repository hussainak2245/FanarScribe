import { Textarea } from "@/components/ui/textarea";
import type { ClinicalClaim, SoapSectionKey } from "@/types/soap";
import { ClaimConfidenceRow } from "@/features/uncertainty/ClaimConfidenceRow";

const sectionTitles: Record<SoapSectionKey, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan"
};

export function SoapSection({ sectionKey, claims }: { sectionKey: SoapSectionKey; claims: ClinicalClaim[] }) {
  return (
    <div className="rounded-md border border-navy-900/10 bg-white/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-navy-900">{sectionTitles[sectionKey]}</h3>
        <span className="text-xs font-black uppercase text-slate-400">{claims.length} claims</span>
      </div>
      <Textarea
        defaultValue={claims.map((claim) => `• ${claim.text}`).join("\n")}
        className="min-h-36 bg-white/70 text-sm leading-7"
      />
      <div className="mt-3 space-y-3">
        {claims.map((claim) => (
          <ClaimConfidenceRow key={claim.id} claim={claim} />
        ))}
      </div>
    </div>
  );
}
