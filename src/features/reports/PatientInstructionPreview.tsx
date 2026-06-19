import { FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { PatientReport } from "@/types/report";
import { ArabicInstructionBlock } from "./ArabicInstructionBlock";

export function PatientInstructionPreview({ report }: { report: PatientReport }) {
  return (
    <SoftPanel className="p-5" tone="paper">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-500" aria-hidden="true" />
          <h2 className="text-2xl font-black text-navy-900">Arabic patient instructions</h2>
        </div>
        <Badge tone="teal">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Generated from physician-approved note
        </Badge>
      </div>
      <div className="rounded-md bg-white/60 p-4" dir="rtl">
        <p className="arabic-text text-lg font-bold leading-8 text-navy-900">{report.summaryArabic}</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ArabicInstructionBlock title="تعليمات الأدوية" items={report.medicationsArabic} />
        <ArabicInstructionBlock title="علامات تستدعي الانتباه" items={report.warningSignsArabic} />
        <ArabicInstructionBlock title="المتابعة" items={report.followUpArabic} />
        <section className="rounded-md bg-ruby-500/10 p-4" dir="rtl">
          <h3 className="arabic-text text-lg font-black text-ruby-500">متى تطلبين رعاية عاجلة؟</h3>
          <p className="arabic-text mt-3 text-sm font-semibold leading-7 text-slate-700">{report.urgentCareArabic}</p>
        </section>
      </div>
      <div className="mt-4">
        <label className="text-sm font-black text-navy-900" htmlFor="doctor-edit">Doctor edit before sending</label>
        <Textarea id="doctor-edit" className="mt-2 arabic-text" dir="rtl" defaultValue={report.doctorEditableNote ?? ""} />
      </div>
    </SoftPanel>
  );
}
