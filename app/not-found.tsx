import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hive-card max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-[var(--muted-ink)]">That route does not exist or the post was removed.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-[var(--accent)] underline-offset-4 hover:underline">
        Return to feed
      </Link>
    </div>
  );
}
