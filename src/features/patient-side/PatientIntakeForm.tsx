import { Send, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SoftPanel } from "@/components/shared/SoftPanel";
import { PatientConsentBlock } from "./PatientConsentBlock";
import { SymptomChatMock } from "./SymptomChatMock";

export function PatientIntakeForm({ appointmentId }: { appointmentId: string }) {
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
              defaultValue="عندي كتمة من أمس مع سعال خفيف. لا توجد حرارة."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input className="arabic-text" dir="rtl" placeholder="متى بدأت؟" defaultValue="من أمس" />
              <Input className="arabic-text" dir="rtl" placeholder="درجة الألم أو الضيق" defaultValue="خفيف إلى متوسط" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary">
              <Mic2 className="h-4 w-4" aria-hidden="true" />
              Voice mock
            </Button>
            <Button type="button">
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit pre-consultation report
            </Button>
          </div>
        </div>
        <SymptomChatMock />
      </div>
    </SoftPanel>
  );
}
