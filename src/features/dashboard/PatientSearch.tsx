import Link from "next/link";
import { Search, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";

export function PatientSearch() {
  return (
    <form className="grid gap-3 rounded-md border border-white/70 bg-white/60 p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input className="pl-9" placeholder="Search patient name, MRN, or scan ID" defaultValue="P023" />
      </label>
      <button className={buttonVariants({ variant: "secondary" })} type="button">
        <ScanLine className="h-4 w-4" aria-hidden="true" />
        Scan
      </button>
      <Link className={buttonVariants({ variant: "primary" })} href={routes.patient("P023")}>
        Load Patient
      </Link>
    </form>
  );
}
