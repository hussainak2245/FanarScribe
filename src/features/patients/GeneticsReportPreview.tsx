import { Dna } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { formatDate } from "@/lib/utils/formatDate";
import type { ReportPreview } from "@/types/patient";

export function GeneticsReportPreview({ report }: { report: ReportPreview }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-black text-navy-900">
          <Dna className="h-4 w-4 text-magenta-400" aria-hidden="true" />
          {report.title}
        </p>
        <Badge tone="magenta">{formatDate(report.date)}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-500">{report.summary}</p>
    </SoftPanel>
  );
}
