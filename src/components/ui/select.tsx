import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 rounded-app border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-100",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
