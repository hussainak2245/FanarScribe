import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { DashboardHero } from "@/features/dashboard/DashboardHero";
import { AppointmentList } from "@/features/dashboard/AppointmentList";
import { NoteHistory } from "@/features/dashboard/NoteHistory";
import { getAppointments } from "@/lib/api/patients";
import { getDoctorStats } from "@/lib/api/stats";

export default async function DoctorDashboardPage() {
  const [appointments, stats] = await Promise.all([getAppointments(), getDoctorStats()]);

  return (
    <DynamicPaperShell>
      <div className="space-y-5 p-4 sm:p-5">
        <DashboardHero appointmentCount={appointments.length} signals={stats.signals} notesReady={stats.notes_ready} />
        <AppointmentList appointments={appointments} />
        <NoteHistory />
      </div>
    </DynamicPaperShell>
  );
}
