import Link from "next/link";
import { CheckCircle2, Download, FileText, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { routes } from "@/lib/constants/routes";

export function FinalApprovalBar({ encounterId, readiness }: { encounterId: string; readiness: number }) {
  return (
    <div className="rounded-app border border-zinc-200 bg-white p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent-500" aria-hidden="true" />
            <h2 className="text-lg font-medium text-zinc-950">Final readiness</h2>
          </div>
          <div className="mt-3 max-w-xl">
            <Progress value={readiness * 100} />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-500">{Math.round(readiness * 100)}% ready for physician approval</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Draft
          </Button>
          <Button type="button" variant="primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Approve Final Note
          </Button>
          <Button type="button" variant="outline">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export to EHR
          </Button>
          <Link className={buttonVariants({ variant: "secondary" })} href={routes.patientInstructions(encounterId)}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            Generate Patient Instructions
          </Link>
        </div>
      </div>
    </div>
  );
}
