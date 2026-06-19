import { Languages, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { SignalDot } from "@/components/shared/SignalDot";
import type { Patient } from "@/types/patient";

export function PatientSnapshot({ patient, compact = false }: { patient: Patient; compact?: boolean }) {
  return (
    <SoftPanel className={compact ? "p-4" : "p-5"} tone="paper">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-teal-500/10 text-teal-600">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-navy-900">{patient.name}</h2>
            <span className="arabic-text text-sm font-semibold text-slate-500">{patient.nameArabic}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {patient.id} · {patient.age} · {patient.sex}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="cyan">
              <Languages className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {patient.languagePreference}
            </Badge>
            <Badge tone={patient.consentStatus === "signed" ? "teal" : "gold"}>
              <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Consent {patient.consentStatus}
            </Badge>
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-white/60 p-3">
            <p className="text-xs font-black uppercase text-slate-400">Chronic conditions</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {patient.chronicConditions.map((condition) => (
                <Badge key={condition} tone="plum">{condition}</Badge>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-white/60 p-3">
            <p className="text-xs font-black uppercase text-slate-400">Risk signals</p>
            <div className="mt-2 space-y-2">
              {patient.riskSignals.map((signal) => (
                <p key={signal} className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <SignalDot tone="coral" />
                  {signal}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </SoftPanel>
  );
}
