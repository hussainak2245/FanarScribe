import Link from "next/link";

export function DoctorTopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center px-4 sm:px-6">
        <Link className="sajil-wordmark text-xl text-zinc-950" href="/">
          SAJIL
        </Link>
      </div>
    </header>
  );
}
