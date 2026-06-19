import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FloatingPrompt({
  children,
  className,
  tone = "magenta"
}: {
  children: ReactNode;
  className?: string;
  tone?: "magenta" | "cyan" | "gold";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-accent-100 bg-accent-50 text-accent-600"
      : tone === "gold"
        ? "border-gold-400/30 bg-gold-400/10 text-gold-500"
        : "border-accent-100 bg-accent-50 text-accent-600";

  return (
    <div className={cn("flex gap-3 rounded-app border px-3 py-3 text-sm leading-6", toneClass, className)}>
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
