import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confidenceLabel } from "@/lib/utils/confidence";
import type { ClinicalClaim } from "@/types/soap";
import { EvidenceLink } from "./EvidenceLink";
import { UncertaintyTag } from "./UncertaintyTag";

export function ClaimConfidenceRow({ claim }: { claim: ClinicalClaim }) {
  return (
    <div className="rounded-md bg-white/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UncertaintyTag status={claim.status} />
        <span className="text-xs font-black text-slate-400">{Math.round(claim.confidence * 100)}% · {confidenceLabel(claim.confidence)}</span>
      </div>
      {claim.reason ? <p className="mt-2 text-xs leading-5 text-slate-500">{claim.reason}</p> : null}
      <EvidenceLink evidence={claim.evidenceText} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm">
          <Check className="h-4 w-4" aria-hidden="true" />
          Accept
        </Button>
        <Button type="button" variant="ghost" size="sm">
          <X className="h-4 w-4" aria-hidden="true" />
          Reject
        </Button>
      </div>
    </div>
  );
}
