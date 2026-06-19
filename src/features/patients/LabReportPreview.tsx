import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { formatDate } from "@/lib/utils/formatDate";
import type { ReportPreview } from "@/types/patient";

export function LabReportPreview({ report }: { report: ReportPreview }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-teal-500" aria-hidden="true" />
            <p className="text-sm font-black text-navy-900">{report.title}</p>
          </div>
          <p className="text-sm leading-6 text-slate-500">{report.summary}</p>
        </div>
        <Badge tone={report.abnormal ? "gold" : "teal"}>{formatDate(report.date)}</Badge>
      </div>
    </SoftPanel>
  );
}
