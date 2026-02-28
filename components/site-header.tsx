import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          Hivemind.me
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--muted-ink)]">
          <Link href="/">Feed</Link>
          <Link href="/dashboard">Operator Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
