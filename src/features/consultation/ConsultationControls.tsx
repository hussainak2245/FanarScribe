import Link from "next/link";
import { Pause, Save, Square, EyeOff } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SignalDot } from "@/components/shared/SignalDot";
import { noteFormats } from "@/lib/constants/noteFormats";
import { routes } from "@/lib/constants/routes";
import type { Consultation } from "@/types/consultation";

export function ConsultationControls({ consultation }: { consultation: Consultation }) {
  return (
    <div className="flex flex-col gap-3 rounded-app border border-zinc-200 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <SignalDot tone="coral" pulse />
          <h1 className="truncate text-lg font-medium text-zinc-950">{consultation.patient.name}</h1>
          <span className="text-sm font-medium text-zinc-500">{consultation.patient.id}</span>
          <Badge tone="teal">Consent {consultation.patient.consentStatus}</Badge>
          <Badge tone="coral">Recording</Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Arabic-first consultation workspace · {consultation.id}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select defaultValue={consultation.noteFormat} aria-label="Note format">
          {noteFormats.map((format) => (
            <option key={format} value={format}>{format}</option>
          ))}
        </Select>
        <Button type="button" variant="secondary" size="sm">
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          Privacy
        </Button>
        <Button type="button" variant="secondary" size="sm">
          <Pause className="h-4 w-4" aria-hidden="true" />
          Pause
        </Button>
        <Link className={buttonVariants({ variant: "danger", size: "sm" })} href={routes.finalReview(consultation.id)}>
          <Square className="h-4 w-4" aria-hidden="true" />
          Stop
        </Link>
        <Button type="button" variant="primary" size="sm">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save draft
        </Button>
      </div>
    </div>
  );
}
