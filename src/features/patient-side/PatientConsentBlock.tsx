import { ShieldCheck } from "lucide-react";

function ConsentCheckbox({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-md bg-white/60 p-3 text-sm leading-6 text-slate-700">
      <input className="mt-1 h-4 w-4 accent-teal-500" type="checkbox" defaultChecked={defaultChecked} />
      <span className="arabic-text flex-1">{label}</span>
    </label>
  );
}

export function PatientConsentBlock() {
  return (
    <div className="rounded-md bg-white/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-teal-500" aria-hidden="true" />
        <h2 className="text-lg font-black text-navy-900">الموافقة والخصوصية</h2>
      </div>
      <div className="space-y-2">
        <ConsentCheckbox label="أوافق على مشاركة الأعراض مع الطبيب قبل الموعد." defaultChecked />
        <ConsentCheckbox label="أفهم أن الطبيب سيراجع التقرير قبل اعتماده." defaultChecked />
      </div>
    </div>
  );
}
