import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function DynamicPaperShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8", className)}>
      <div className="relative overflow-hidden rounded-app border border-zinc-200 bg-white">
        <div className="relative">{children}</div>
      </div>
    </main>
  );
}
