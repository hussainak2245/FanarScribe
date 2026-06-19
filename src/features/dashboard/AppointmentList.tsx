import { SoftPanel } from "@/components/shared/SoftPanel";
import type { Appointment } from "@/types/appointment";
import { AppointmentStrip } from "./AppointmentStrip";

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  return (
    <SoftPanel className="p-4 sm:p-5" tone="paper">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-magenta-500">Today</p>
          <h2 className="mt-1 text-2xl font-black text-navy-900">Appointment manuscript</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">{appointments.length} scheduled visits</p>
      </div>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentStrip key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </SoftPanel>
  );
}
