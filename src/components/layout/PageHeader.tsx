import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  body,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-3 text-xs font-black uppercase text-magenta-500">{eyebrow}</p> : null}
        <h1 className="text-3xl font-black leading-tight text-navy-900 sm:text-5xl">{title}</h1>
        {body ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{body}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
