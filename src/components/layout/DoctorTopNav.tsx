import Link from "next/link";
import { routes } from "@/lib/constants/routes";

const navItems = [
  { href: routes.consultation("E001"), label: "Scribes" },
  { href: routes.patient("P023"), label: "Patients" },
  { href: routes.finalReview("E001"), label: "Results" }
];

export function DoctorTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-zinc-950 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="sajil-wordmark text-xl text-zinc-950" href="/">
          SAJIL
        </Link>
        <nav className="hidden items-center gap-0 md:flex" aria-label="Doctor navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-l-2 border-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-950 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-zinc-950"
            href={routes.consultation("E001")}
          >
            New Scribe
          </Link>
        </div>
      </div>
    </header>
  );
}
