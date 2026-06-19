import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Progress({
  value = 0,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-zinc-100", className)} {...props}>
      <div
        className="h-full rounded-full bg-accent-500 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
