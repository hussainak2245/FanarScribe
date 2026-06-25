import Link from "next/link";
import { routes } from "@/lib/constants/routes";

const navItems = [
  { href: routes.consultation("E001"), label: "Scribes" },
  { href: routes.patient("P023"), label: "Patients" },
  { href: routes.finalReview("E001"), label: "Results" }
];

export function DoctorTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="sajil-wordmark text-xl text-zinc-950" href="/">
          SAJIL
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Doctor navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-app px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            className="rounded-app bg-accent-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-600"
            href={routes.consultation("E001")}
          >
            New scribe
          </Link>
        </div>
      </div>
    </header>
  );
}
