import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-4", className)} {...props} />;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex rounded-md border border-navy-900/10 bg-white/60 p-1", className)}
      role="tablist"
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-navy-900",
        active && "bg-white text-navy-900 shadow-sm",
        className
      )}
      role="tab"
      aria-selected={active}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("outline-none", className)} role="tabpanel" {...props} />;
}
