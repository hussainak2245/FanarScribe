"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileText, Loader2, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";
import { approveNote } from "@/lib/api/notes-api";

export function FinalApprovalBar({
  encounterId,
  resolvedCount = 0,
  totalCount = 0,
  runId
}: {
  encounterId: string;
  resolvedCount?: number;
  totalCount?: number;
  runId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleAction(action: "approve" | "save_draft") {
    setSaving(true);
    setNotice("");
    try {
      await approveNote(encounterId, action, runId);
      if (action === "approve") {
        setApproved(true);
        setNotice("Note approved.");
      } else {
        setNotice("Draft saved.");
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-app border border-zinc-200 bg-white p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent-500" aria-hidden="true" />
            <h2 className="text-lg font-medium text-zinc-950">Final readiness</h2>
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            {totalCount > 0
              ? `${resolvedCount} of ${totalCount} checkpoints resolved`
              : "No checkpoints yet"}
            {notice && <span className="ml-3 text-accent-500">{notice}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAction("save_draft")}
            disabled={saving || approved}
          >
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <Save className="h-4 w-4" aria-hidden="true" />}
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleAction("approve")}
            disabled={saving || approved}
          >
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            {approved ? "Approved" : "Approve Final Note"}
          </Button>
          <Button type="button" variant="outline" disabled>
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
