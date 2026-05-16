"use client";

import Link from "next/link";
import { useAdminBoards } from "@/lib/client-store";

export default function AdminPage() {
  const { boards, hydrated, remove } = useAdminBoards();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your boards</h1>
        <p className="text-sm text-[var(--muted)]">
          Boards you created from this browser. Admin tokens live in
          localStorage — if you clear your browser data, you lose admin access.
        </p>
      </div>

      {!hydrated ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : boards.length === 0 ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          <p className="mb-2">You haven&apos;t created any boards in this browser yet.</p>
          <Link
            href="/"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            Create one
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {boards.map((b) => (
            <li
              key={b.boardId}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <Link
                  href={`/b/${b.boardId}`}
                  className="font-medium hover:underline underline-offset-2 truncate block"
                >
                  {b.title}
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  /b/{b.boardId} · created{" "}
                  {new Date(b.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Forget "${b.title}" from this browser?\n\nThis only removes the admin token locally — the board itself stays online. You can't recover the admin token unless you saved it.`
                    )
                  ) {
                    remove(b.boardId);
                  }
                }}
                className="text-xs text-[var(--muted)] hover:text-red-600 dark:hover:text-red-400"
                title="Forget admin token in this browser"
              >
                Forget
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
