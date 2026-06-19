import { EyeOff, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import type { Patient } from "@/types/patient";

export function ConsentPrivacyPanel({ patient }: { patient: Patient }) {
  return (
    <SoftPanel className="p-4" tone="mist">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-teal-500" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-black text-navy-900">Consent and privacy</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Consent status is <span className="font-semibold text-navy-900">{patient.consentStatus}</span>. Privacy mode is available for sensitive details.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={patient.consentStatus === "signed" ? "teal" : "gold"}>Consent {patient.consentStatus}</Badge>
            <Badge tone="plum">
              <EyeOff className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Privacy mode ready
            </Badge>
          </div>
        </div>
      </div>
    </SoftPanel>
  );
}
