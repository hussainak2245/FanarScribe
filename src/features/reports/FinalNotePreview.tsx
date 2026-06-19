import { FileText } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { EvidencePopover } from "@/features/consultation/EvidencePopover";
import { UncertaintyTag } from "@/features/uncertainty/UncertaintyTag";
import type { SoapNote, SoapSectionKey } from "@/types/soap";

const titles: Record<SoapSectionKey, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan"
};

const order = ["subjective", "objective", "assessment", "plan"] as const;

export function FinalNotePreview({ note }: { note: SoapNote }) {
  return (
    <SoftPanel className="p-5" tone="paper">
      <div className="mb-5 flex items-center gap-2">
        <FileText className="h-5 w-5 text-teal-500" aria-hidden="true" />
        <h2 className="text-2xl font-black text-navy-900">Final SOAP note</h2>
      </div>
      <div className="space-y-5">
        {order.map((section) => (
          <section key={section} className="rounded-md bg-white/60 p-4">
            <h3 className="text-lg font-black text-navy-900">{titles[section]}</h3>
            <div className="mt-3 space-y-3">
              {note.sections[section].map((claim) => (
                <div key={claim.id} className="border-l-2 border-teal-500/25 pl-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="max-w-3xl text-sm leading-7 text-slate-700">{claim.text}</p>
                    <UncertaintyTag status={claim.status} />
                  </div>
                  <EvidencePopover evidence={claim.evidenceText} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SoftPanel>
  );
}
