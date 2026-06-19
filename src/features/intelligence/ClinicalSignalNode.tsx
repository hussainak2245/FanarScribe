import { SignalDot } from "@/components/shared/SignalDot";

export function ClinicalSignalNode({
  label,
  value,
  tone = "teal"
}: {
  label: string;
  value: string;
  tone?: "teal" | "cyan" | "coral" | "magenta" | "gold" | "ruby";
}) {
  return (
    <div className="rounded-md bg-white/60 p-3">
      <div className="flex items-center gap-2">
        <SignalDot tone={tone} />
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-navy-900">{value}</p>
    </div>
  );
}
