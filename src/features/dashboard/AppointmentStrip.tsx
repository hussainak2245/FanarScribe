import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SignalDot } from "@/components/shared/SignalDot";
import { routes } from "@/lib/constants/routes";
import type { Appointment } from "@/types/appointment";

export function AppointmentStrip({ appointment }: { appointment: Appointment }) {
  const urgent = appointment.status.includes("urgent flag");

  return (
    <Link
      href={routes.patient(appointment.patientId)}
      className="group grid gap-4 rounded-app border border-zinc-200 bg-white px-4 py-4 transition hover:bg-zinc-50 md:grid-cols-[90px_minmax(0,1fr)_auto]"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
        <Clock3 className="h-4 w-4 text-accent-500" aria-hidden="true" />
        {appointment.time}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <SignalDot tone={urgent ? "ruby" : "teal"} />
          <h3 className="truncate text-base font-medium text-zinc-950">{appointment.patientName}</h3>
          <span className="arabic-text text-sm font-medium text-zinc-500">{appointment.patientNameArabic}</span>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{appointment.reason}</p>
        <p className="mt-1 text-xs font-medium text-zinc-400">{appointment.clinic} · {appointment.language}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {appointment.status.map((status) => (
          <StatusBadge key={`${appointment.id}-${status}`} status={status} />
        ))}
        <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900" aria-hidden="true" />
      </div>
    </Link>
  );
}
