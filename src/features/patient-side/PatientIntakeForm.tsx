"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mic2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { PatientConsentBlock } from "./PatientConsentBlock";
import { SymptomChatMock } from "./SymptomChatMock";
import { submitPatientIntake } from "@/lib/api/intake";

export function PatientIntakeForm({ appointmentId }: { appointmentId: string }) {
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      await submitPatientIntake({
        encounter_id: appointmentId,
        symptoms,
        duration,
        severity,
        consent: true
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SoftPanel className="p-5" tone="paper">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-teal-500" aria-hidden="true" />
          <p className="text-xl font-black text-navy-900">تم الإرسال بنجاح</p>
          <p className="text-sm text-zinc-500">Your pre-consultation report has been received.</p>
        </div>
      </SoftPanel>
    );
  }

  return (
    <SoftPanel className="p-5" tone="paper">
      <div className="mb-5">
        <p className="text-xs font-black uppercase text-magenta-500">Appointment {appointmentId}</p>
        <h1 className="mt-1 text-3xl font-black text-navy-900">تقرير ما قبل الزيارة</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          <PatientConsentBlock />
          <div className="rounded-md bg-white/60 p-4" dir="rtl">
            <label className="arabic-text text-sm font-black text-navy-900" htmlFor="symptoms">اكتبي الأعراض الرئيسية</label>
            <Textarea
              id="symptoms"
              className="arabic-text mt-2"
              dir="rtl"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="اكتبي الأعراض هنا..."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                className="arabic-text"
                dir="rtl"
                placeholder="متى بدأت؟"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <Input
                className="arabic-text"
                dir="rtl"
                placeholder="درجة الألم أو الضيق"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled>
              <Mic2 className="h-4 w-4" aria-hidden="true" />
              Voice mock
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting || !symptoms}>
              {submitting
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Send className="h-4 w-4" aria-hidden="true" />}
              Submit pre-consultation report
            </Button>
          </div>
        </div>
        <SymptomChatMock />
      </div>
    </SoftPanel>
  );
}
