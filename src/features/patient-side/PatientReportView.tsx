import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { PatientReport } from "@/types/report";
import { ArabicInstructionBlock } from "@/features/reports/ArabicInstructionBlock";

export function PatientReportView({ report }: { report: PatientReport }) {
  return (
    <SoftPanel className="p-5" tone="paper">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="arabic-text text-3xl font-black text-navy-900">تقرير الزيارة</h1>
        <Badge tone="teal">Approved</Badge>
      </div>
      <div className="rounded-md bg-white/60 p-4" dir="rtl">
        <p className="arabic-text text-lg font-bold leading-8 text-navy-900">{report.summaryArabic}</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ArabicInstructionBlock title="الأدوية" items={report.medicationsArabic} />
        <ArabicInstructionBlock title="المتابعة" items={report.followUpArabic} />
        <ArabicInstructionBlock title="علامات التحذير" items={report.warningSignsArabic} />
        <section className="rounded-md bg-ruby-500/10 p-4" dir="rtl">
          <h2 className="arabic-text text-lg font-black text-ruby-500">الرعاية العاجلة</h2>
          <p className="arabic-text mt-3 text-sm font-semibold leading-7 text-slate-700">{report.urgentCareArabic}</p>
        </section>
      </div>
    </SoftPanel>
  );
}
