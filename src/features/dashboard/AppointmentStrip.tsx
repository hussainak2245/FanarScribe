import Link from "next/link";
import { ArrowRight, Clock3, FileText, Mic } from "lucide-react";
import { routes } from "@/lib/constants/routes";
import type { Appointment } from "@/types/appointment";

export function AppointmentStrip({ appointment }: { appointment: Appointment }) {
  const urgent = appointment.status.includes("urgent flag");

  return (
    <div className={`grid gap-3 border px-4 py-3 md:grid-cols-[80px_minmax(0,1fr)_auto] ${
      urgent ? "border-zinc-950 bg-zinc-50" : "border-zinc-200 bg-white"
    }`}>
      <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-950">
        <Clock3 className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        {appointment.time}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {urgent && (
            <span className="bg-zinc-950 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
              Urgent
            </span>
          )}
          <h3 className="truncate font-mono text-sm font-bold text-zinc-950">{appointment.patientName}</h3>
          <span className="arabic-text text-sm text-zinc-500">{appointment.patientNameArabic}</span>
        </div>
        <p className="mt-0.5 text-sm text-zinc-600">{appointment.reason}</p>
        <p className="mt-0.5 font-mono text-[10px] text-zinc-400">{appointment.clinic} · {appointment.language}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {appointment.status.filter((s) => s !== "urgent flag").map((status) => (
          <span key={`${appointment.id}-${status}`} className="border border-zinc-200 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            {status}
          </span>
        ))}
        <Link
          href={routes.patientIntake(appointment.id)}
          className="inline-flex h-8 items-center gap-1.5 border border-zinc-300 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-600 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
        >
          <FileText className="h-3 w-3" aria-hidden="true" />
          Intake
        </Link>
        <Link
          href={routes.consultation(appointment.encounterId)}
          className="inline-flex h-8 items-center gap-1.5 border-2 border-zinc-950 bg-zinc-950 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-white hover:bg-white hover:text-zinc-950"
        >
          <Mic className="h-3 w-3" aria-hidden="true" />
          Scribe
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
