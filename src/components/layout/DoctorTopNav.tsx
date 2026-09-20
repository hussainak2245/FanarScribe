import Link from "next/link";
import { Feather } from "lucide-react";

export function DoctorTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 sm:px-6">
        <Link className="flex items-center gap-2 text-zinc-950" href="/" aria-label="Sajil home">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500 text-white">
            <Feather className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="sajil-wordmark text-xl">SAJIL</span>
        </Link>
      </div>
    </header>
  );
}
