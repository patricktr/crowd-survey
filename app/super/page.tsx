"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSuperToken } from "@/lib/client-store";
import type { BoardOverview, PersonOverview } from "@/lib/queries";

type Overview = { boards: BoardOverview[]; people: PersonOverview[] };

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

      {token && <SuperOverview token={token} />}

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

function SuperOverview({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/superadmin/overview", {
      headers: { "x-admin-token": token },
      cache: "no-store",
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setError("Token rejected. Try replacing it above.");
          setData(null);
          return;
        }
        if (!res.ok) {
          setError("Failed to load overview.");
          return;
        }
        setError(null);
        setData(await res.json());
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load overview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tick]);

  function refresh() {
    setLoading(true);
    setTick((t) => t + 1);
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted)]">Loading overview…</p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-semibold">
            Boards{" "}
            <span className="text-[var(--muted)] font-normal text-sm">
              ({data.boards.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-[var(--muted)] hover:underline"
          >
            Refresh
          </button>
        </div>
        {data.boards.length === 0 ? (
          <p className="text-sm text-[var(--muted)] italic">No boards yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.boards.map((b) => (
              <li
                key={b.id}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/b/${b.id}`}
                      className="font-medium hover:underline underline-offset-2 truncate block"
                    >
                      {b.title}
                    </Link>
                    {b.description && (
                      <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">
                        {b.description}
                      </p>
                    )}
                  </div>
                  {b.closed && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-xs whitespace-nowrap">
                      Closed
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                  <span>/b/{b.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {b.questionCount}{" "}
                    {b.questionCount === 1 ? "question" : "questions"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {b.agreementCount}{" "}
                    {b.agreementCount === 1 ? "agreement" : "agreements"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span title={b.lastActivity}>
                    last activity{" "}
                    {new Date(b.lastActivity).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-2">
          People{" "}
          <span className="text-[var(--muted)] font-normal text-sm">
            ({data.people.length})
          </span>
        </h2>
        {data.people.length === 0 ? (
          <p className="text-sm text-[var(--muted)] italic">
            Nobody has posted or agreed yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)] bg-[var(--surface)]">
            {data.people.map((p) => (
              <li
                key={p.name.toLowerCase()}
                className="px-3 py-2 flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                  {p.questionCount}{" "}
                  {p.questionCount === 1 ? "question" : "questions"}
                  {" · "}
                  {p.agreementCount}{" "}
                  {p.agreementCount === 1 ? "agreement" : "agreements"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
