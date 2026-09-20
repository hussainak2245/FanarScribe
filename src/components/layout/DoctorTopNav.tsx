import Link from "next/link";
export function DoctorTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 sm:px-6">
        <Link className="flex items-center gap-2 text-zinc-950" href="/" aria-label="Sajil home">
          <img className="h-7 w-7 rounded-lg object-contain" src="/images/sajil-logo.png" alt="" aria-hidden="true" />
          <span className="sajil-wordmark text-xl">SAJIL</span>
        </Link>
      </div>
    </header>
  );
}
