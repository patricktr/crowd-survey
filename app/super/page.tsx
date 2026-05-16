"use client";

import Link from "next/link";
import { useState } from "react";
import { useSuperToken } from "@/lib/client-store";

export default function SuperAdminPage() {
  const { token, setToken, clearToken } = useSuperToken();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    message: string;
  } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = value.trim();
    if (cleaned.length === 0) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/superadmin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleaned }),
      });
      if (res.status === 501) {
        setStatus({
          kind: "err",
          message:
            "Server has no SUPERADMIN_TOKEN configured. Add it in Vercel env and redeploy.",
        });
        return;
      }
      if (res.status === 401) {
        setStatus({ kind: "err", message: "That token is not valid." });
        return;
      }
      if (!res.ok) {
        setStatus({ kind: "err", message: "Unexpected error." });
        return;
      }
      setToken(cleaned);
      setValue("");
      setStatus({
        kind: "ok",
        message: "Saved. You can now admin any board from this browser.",
      });
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    clearToken();
    setStatus({ kind: "ok", message: "Superadmin token removed." });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Superadmin</h1>
        <p className="text-sm text-[var(--muted)]">
          Paste the server&apos;s <code>SUPERADMIN_TOKEN</code> to gain admin
          powers on any board. Stored in this browser&apos;s localStorage. Treat
          it like a password — anyone with it can delete or modify any board.
        </p>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <p className="text-sm">
          Status:{" "}
          {token ? (
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Active in this browser
            </span>
          ) : (
            <span className="text-[var(--muted)]">Not set</span>
          )}
        </p>
        <form onSubmit={save} className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="super-token">
            Superadmin token
          </label>
          <input
            id="super-token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste here"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || value.trim().length === 0}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Verifying…" : token ? "Replace" : "Save"}
            </button>
            {token && (
              <button
                type="button"
                onClick={clear}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--background)]"
              >
                Remove
              </button>
            )}
          </div>
          {status && (
            <p
              role="alert"
              className={
                status.kind === "ok"
                  ? "text-sm text-emerald-700 dark:text-emerald-400"
                  : "text-sm text-red-600 dark:text-red-400"
              }
            >
              {status.message}
            </p>
          )}
        </form>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Back to{" "}
        <Link href="/" className="underline underline-offset-2">
          home
        </Link>{" "}
        ·{" "}
        <Link href="/admin" className="underline underline-offset-2">
          your boards
        </Link>
      </p>
    </div>
  );
}
