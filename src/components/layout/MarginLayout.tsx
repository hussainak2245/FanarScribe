import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function MarginLayout({
  left,
  center,
  right,
  className
}: {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 p-4 lg:grid-cols-[minmax(230px,0.75fr)_minmax(420px,1.35fr)_minmax(260px,0.85fr)] lg:gap-5 lg:p-5 xl:grid-cols-[310px_minmax(520px,1fr)_340px]",
        className
      )}
    >
      {left ? <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{left}</aside> : null}
      <section className="min-w-0 space-y-4">{center}</section>
      {right ? <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{right}</aside> : null}
    </div>
  );
}
