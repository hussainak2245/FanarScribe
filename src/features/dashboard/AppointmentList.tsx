import type { Appointment } from "@/types/appointment";
import { AppointmentStrip } from "./AppointmentStrip";

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-zinc-950 pb-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">Today</p>
          <h2 className="mt-0.5 text-2xl font-black text-zinc-950">Appointments</h2>
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
          {appointments.length} visits
        </p>
      </div>
      <div className="space-y-2">
        {appointments.map((appointment) => (
          <AppointmentStrip key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </div>
  );
}
