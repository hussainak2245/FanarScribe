import { DynamicPaperShell } from "@/components/layout/DynamicPaperShell";
import { DashboardHero } from "@/features/dashboard/DashboardHero";
import { AppointmentList } from "@/features/dashboard/AppointmentList";
import { getAppointments } from "@/lib/api/patients";

export default async function DoctorDashboardPage() {
  const appointments = await getAppointments();

  return (
    <DynamicPaperShell>
      <div className="space-y-5 p-4 sm:p-5">
        <DashboardHero />
        <AppointmentList appointments={appointments} />
      </div>
    </DynamicPaperShell>
  );
}
