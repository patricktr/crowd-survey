"use client";

import { useState } from "react";
import type { QuestionWithAgreements } from "@/lib/queries";

type Props = {
  question: QuestionWithAgreements;
  myName: string | null;
  isAdmin: boolean;
  closed: boolean;
  onAgreeChange: (next: { agreed: boolean }) => void;
  onDelete: () => void;
};

export function QuestionItem({
  question,
  myName,
  isAdmin,
  closed,
  onAgreeChange,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myNameLower = myName?.toLowerCase() ?? null;
  const iAuthored = myNameLower === question.authorName.toLowerCase();
  const iAgreed =
    myNameLower !== null &&
    question.agreements.some((a) => a.name.toLowerCase() === myNameLower);
  const count = question.agreements.length;

  async function toggleAgree() {
    if (!myName || iAuthored || closed) return;
    setBusy(true);
    setError(null);
    try {
      if (iAgreed) {
        const url = `/api/questions/${question.id}/agreements?name=${encodeURIComponent(
          myName
        )}`;
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok && res.status !== 204) {
          throw new Error("Couldn't remove agreement");
        }
        onAgreeChange({ agreed: false });
      } else {
        const res = await fetch(`/api/questions/${question.id}/agreements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: myName }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Couldn't agree");
        }
        onAgreeChange({ agreed: true });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {question.body}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
        <span>
          by <span className="font-medium text-[var(--foreground)]">{question.authorName}</span>
        </span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
          disabled={count === 0}
          aria-expanded={expanded}
        >
          {count} {count === 1 ? "agrees" : "agree"}
          {count > 0 && <span aria-hidden="true">{expanded ? " ▾" : " ▸"}</span>}
        </button>
      </div>

      {expanded && count > 0 && (
        <ul className="mt-2 text-xs text-[var(--muted)] flex flex-wrap gap-x-2 gap-y-1">
          {question.agreements.map((a) => (
            <li
              key={a.name}
              className="rounded-full bg-[var(--background)] border border-[var(--border)] px-2 py-0.5"
            >
              {a.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAgree}
          disabled={busy || closed || iAuthored}
          title={
            iAuthored
              ? "You wrote this one"
              : closed
                ? "Board is closed"
                : iAgreed
                  ? "Click to remove your agreement"
                  : "Agree with this"
          }
          className={
            iAgreed
              ? "rounded-md border border-[var(--accent)] bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
              : "rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface)] disabled:opacity-50"
          }
        >
          {iAgreed ? "✓ You agree" : "Agree"}
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm("Delete this question? This can't be undone.")
              ) {
                onDelete();
              }
            }}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
