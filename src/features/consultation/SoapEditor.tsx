import { FilePenLine } from "lucide-react";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { SoapNote } from "@/types/soap";
import { SoapSection } from "./SoapSection";

const sectionOrder = ["subjective", "objective", "assessment", "plan"] as const;

export function SoapEditor({ note }: { note: SoapNote }) {
  return (
    <SoftPanel className="p-4" tone="cloud">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilePenLine className="h-4 w-4 text-teal-500" aria-hidden="true" />
          <h2 className="text-lg font-black text-navy-900">SOAP note manuscript</h2>
        </div>
        <p className="text-xs font-black uppercase text-slate-500">{note.format} · {Math.round(note.readiness * 100)}% ready</p>
      </div>
      <div className="space-y-4">
        {sectionOrder.map((section) => (
          <SoapSection key={section} sectionKey={section} claims={note.sections[section]} />
        ))}
      </div>
    </SoftPanel>
  );
}
