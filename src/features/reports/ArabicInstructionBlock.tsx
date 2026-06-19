import { cn } from "@/lib/utils/cn";

export function ArabicInstructionBlock({
  title,
  items,
  className
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <section className={cn("rounded-md bg-white/60 p-4", className)} dir="rtl">
      <h3 className="arabic-text text-lg font-black text-navy-900">{title}</h3>
      <ul className="arabic-text mt-3 space-y-2 text-sm leading-7 text-slate-700">
        {items.map((item) => (
          <li key={item} className="border-r-2 border-teal-500/30 pr-3">{item}</li>
        ))}
      </ul>
    </section>
  );
}
