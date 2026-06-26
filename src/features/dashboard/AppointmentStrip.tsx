import Link from "next/link";
import { Clock3 } from "lucide-react";
import { routes } from "@/lib/constants/routes";
import type { Appointment } from "@/types/appointment";

export function AppointmentStrip({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-center gap-4 rounded-app border border-zinc-200 bg-white px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 w-14 flex-shrink-0">
        <Clock3 className="h-4 w-4 text-accent-500" aria-hidden="true" />
        {appointment.time}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-medium text-zinc-950">{appointment.patientName}</h3>
      </div>
      <Link
        href={routes.consultation(appointment.encounterId)}
        className="inline-flex h-9 items-center rounded-app bg-zinc-950 px-4 text-xs font-medium text-white hover:bg-accent-600 flex-shrink-0"
      >
        Start
      </Link>
    </div>
  );
}
