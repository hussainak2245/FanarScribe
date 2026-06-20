import Link from "next/link";
import type { ReactNode } from "react";
import { FileText, Mic2 } from "lucide-react";
import { appointments } from "@/lib/mock/appointments";
import { findPatient, patients } from "@/lib/mock/patients";
import { routes } from "@/lib/constants/routes";

function WorkflowBadge({ children }: { children: ReactNode }) {
  return <span className="rounded-app bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500">{children}</span>;
}

function PatientRow({
  patientId,
  encounterId,
  arrival,
  status,
  urgency
}: {
  patientId: string;
  encounterId: string;
  arrival: string;
  status: string;
  urgency: string;
}) {
  const patient = findPatient(patientId);

  return (
    <article className="grid gap-4 border-b border-zinc-100 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-zinc-950">{patient.id}</h3>
          <span className="text-sm text-zinc-500">{patient.name}</span>
          <span className="arabic-text text-sm text-zinc-500">{patient.nameArabic}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{patient.preVisitSummary}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <WorkflowBadge>Arrival {arrival}</WorkflowBadge>
          <WorkflowBadge>Urgency {urgency}</WorkflowBadge>
          <WorkflowBadge>{status}</WorkflowBadge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Link
          href={routes.consultation(encounterId)}
          className="inline-flex h-10 items-center gap-2 rounded-app bg-accent-500 px-3 text-sm font-medium text-white hover:bg-accent-600"
        >
          <Mic2 className="h-4 w-4" />
          Scribe
        </Link>
        <Link
          href={routes.patient(patient.id)}
          className="inline-flex h-10 items-center gap-2 rounded-app border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:border-accent-200 hover:text-accent-600"
        >
          <FileText className="h-4 w-4" />
          Report
        </Link>
      </div>
    </article>
  );
}

export default async function PatientWorkflowPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const selectedPatient = findPatient(patientId);
  const awaiting = appointments.filter((appointment) => appointment.status.includes("pre-consultation available"));
  const active = appointments.filter((appointment) => appointment.status.includes("pending note") || appointment.status.includes("urgent flag"));
  const completed = appointments.filter((appointment) => appointment.status.includes("ready") || appointment.status.includes("follow-up"));

  return (
    <main className="min-h-screen bg-white px-6 py-6 text-zinc-900">
      <header className="border-b border-zinc-200 pb-5">
        <p className="sajil-wordmark text-3xl text-zinc-950">SAJIL</p>
        <h1 className="mt-6 text-2xl font-medium text-zinc-950">Patient Workflow</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          Track awaiting, active, and completed patients while keeping pre-consultation reports one click away.
        </p>
      </header>

      <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-medium uppercase text-zinc-500">Awaiting Patients</h2>
            <div className="border-y border-zinc-100">
              {awaiting.map((appointment) => (
                <PatientRow
                  key={appointment.id}
                  patientId={appointment.patientId}
                  encounterId={appointment.encounterId}
                  arrival={appointment.time}
                  status="Waiting"
                  urgency={appointment.status.includes("urgent flag") ? "High" : "Routine"}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium uppercase text-zinc-500">Active Patients</h2>
            <div className="border-y border-zinc-100">
              {active.map((appointment) => (
                <PatientRow
                  key={appointment.id}
                  patientId={appointment.patientId}
                  encounterId={appointment.encounterId}
                  arrival={appointment.time}
                  status="In progress"
                  urgency={appointment.status.includes("urgent flag") ? "High" : "Review"}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-medium uppercase text-zinc-500">Completed Patients</h2>
            <div className="border-y border-zinc-100">
              {completed.slice(0, 5).map((appointment) => (
                <PatientRow
                  key={appointment.id}
                  patientId={appointment.patientId}
                  encounterId={appointment.encounterId}
                  arrival={appointment.time}
                  status="Completed"
                  urgency="Stable"
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="border border-zinc-200 p-5">
            <h2 className="text-sm font-medium uppercase text-zinc-500">Pre-Consultation Report</h2>
            <h3 className="mt-3 text-xl font-medium text-zinc-950">{selectedPatient.name}</h3>
            <p className="arabic-text mt-1 text-sm text-zinc-500">{selectedPatient.nameArabic}</p>
            <p className="mt-4 text-sm leading-7 text-zinc-700">{selectedPatient.preVisitSummary}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="font-medium text-zinc-950">Symptoms</p>
                <p className="text-zinc-500">{selectedPatient.riskSignals.join(", ")}</p>
              </div>
              <div>
                <p className="font-medium text-zinc-950">Risk score</p>
                <p className="text-zinc-500">{selectedPatient.riskSignals.length > 1 ? "Moderate" : "Low"}</p>
              </div>
              <div>
                <p className="font-medium text-zinc-950">Language / dialect</p>
                <p className="text-zinc-500">{selectedPatient.languagePreference}</p>
              </div>
              <div>
                <p className="font-medium text-zinc-950">Previous notes</p>
                <p className="text-zinc-500">{selectedPatient.previousVisits[0]?.summary ?? "No prior notes."}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 border border-zinc-200 p-5">
            <h2 className="text-sm font-medium uppercase text-zinc-500">All Patients</h2>
            <div className="mt-3 space-y-2">
              {patients.map((patient) => (
                <Link key={patient.id} href={routes.patient(patient.id)} className="block text-sm text-zinc-600 hover:text-accent-600">
                  {patient.id} · {patient.name}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
