import Link from "next/link";

export default function BoardNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-3">
      <h1 className="text-xl font-semibold">Board not found</h1>
      <p className="text-sm text-[var(--muted)]">
        The link might be wrong, or the board was deleted.
      </p>
      <p>
        <Link
          href="/"
          className="text-[var(--accent)] underline underline-offset-2"
        >
          Start a new one
        </Link>
      </p>
    </div>
  );
}
