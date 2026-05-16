"use client";

import { useCallback, useState } from "react";
import type { Board, QuestionWithAgreements } from "@/lib/queries";
import {
  readAnyAdminTokenFor,
  useAdminBoards,
  useStoredName,
  useSuperToken,
} from "@/lib/client-store";
import { useActivePolling } from "@/lib/use-active-polling";
import { AdminControls } from "./AdminControls";
import { NameDialog } from "./NameDialog";
import { QuestionItem } from "./QuestionItem";

type BoardPayload = {
  board: Board;
  questions: QuestionWithAgreements[];
  isAdmin: boolean;
};

export function BoardView({ initial }: { initial: BoardPayload }) {
  const { name, setName } = useStoredName();
  const adminStore = useAdminBoards();
  const { token: superToken } = useSuperToken();
  const ownToken = adminStore.tokenFor(initial.board.id);
  const adminToken = ownToken ?? superToken;
  const isOwnBoard = ownToken !== null;

  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<BoardPayload> => {
      const headers: Record<string, string> = {};
      const token = readAnyAdminTokenFor(initial.board.id);
      if (token) headers["x-admin-token"] = token;
      const res = await fetch(`/api/boards/${initial.board.id}`, {
        headers,
        signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load board");
      return res.json();
    },
    [initial.board.id]
  );

  const { data, refresh, isActive } = useActivePolling<BoardPayload>(
    fetcher,
    initial,
    { intervalMs: 60_000, idleAfterMs: 5 * 60_000 }
  );

  const { board, questions } = data;
  const isAdmin = adminToken !== null;

  const [pendingAction, setPendingAction] = useState<null | {
    type: "ask-name";
    next: (name: string) => void;
  }>(null);

  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/b/${board.id}`
      : "";

  function withName(action: (name: string) => void | Promise<void>) {
    if (name && name.trim().length > 0) {
      void action(name);
    } else {
      setPendingAction({ type: "ask-name", next: action });
    }
  }

  async function submitQuestion(authorName: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/boards/${board.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, body: newBody }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Couldn't submit");
      }
      setNewBody("");
      await refresh();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!adminToken) return;
    const res = await fetch(`/api/questions/${questionId}`, {
      method: "DELETE",
      headers: { "x-admin-token": adminToken },
    });
    if (res.ok || res.status === 204) {
      await refresh();
    }
  }

  function copyLink() {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* ignore */
      });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{board.title}</h1>
          {board.closed && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-xs">
              Closed
            </span>
          )}
        </div>
        {board.description && (
          <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">
            {board.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 hover:bg-[var(--surface)]"
          >
            {copied ? "Copied!" : "Copy share link"}
          </button>
          <span
            className="text-[var(--muted)] truncate max-w-[60vw]"
            suppressHydrationWarning
          >
            {shareUrl}
          </span>
        </div>
      </header>

      {isAdmin && adminToken && (
        <AdminControls
          board={board}
          adminToken={adminToken}
          isOwnBoard={isOwnBoard}
          onChange={(next) => {
            void refresh();
            if (isOwnBoard && next.title !== undefined) {
              adminStore.add({
                boardId: board.id,
                title: next.title,
                adminToken,
                createdAt: board.createdAt,
              });
            }
          }}
        />
      )}

      <section aria-label="Submit a question">
        <h2 className="sr-only">Add a question</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (board.closed) return;
            const body = newBody.trim();
            if (body.length === 0) return;
            withName((n) => submitQuestion(n));
          }}
          className="space-y-2"
        >
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={board.closed}
            placeholder={
              board.closed
                ? "This board is closed."
                : "Add a question, comment, or concern…"
            }
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm resize-y disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--muted)]">
              {name ? (
                <>
                  Posting as <span className="font-medium">{name}</span>.{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setPendingAction({
                        type: "ask-name",
                        next: (n) => setName(n),
                      })
                    }
                    className="underline underline-offset-2"
                  >
                    Change
                  </button>
                </>
              ) : (
                "You'll be asked for your name before posting."
              )}
            </p>
            <button
              type="submit"
              disabled={
                board.closed || submitting || newBody.trim().length === 0
              }
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
          {submitError && (
            <p
              className="text-xs text-red-600 dark:text-red-400"
              role="alert"
            >
              {submitError}
            </p>
          )}
        </form>
      </section>

      <section aria-label="Questions">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-medium">
            {questions.length}{" "}
            {questions.length === 1 ? "submission" : "submissions"}
          </h2>
          <span
            className="text-xs text-[var(--muted)]"
            title={
              isActive
                ? "Updating every 60s while you're here"
                : "Paused — move or focus the tab to resume"
            }
          >
            {isActive ? "Live (60s)" : "Paused"}
          </span>
        </div>
        {questions.length === 0 ? (
          <p className="text-sm text-[var(--muted)] italic">
            No submissions yet. Be the first.
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                myName={name}
                isAdmin={isAdmin}
                closed={board.closed}
                requestName={withName}
                onAgreeChange={() => void refresh()}
                onDelete={() => void deleteQuestion(q.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <NameDialog
        open={pendingAction !== null}
        initialName={name ?? ""}
        onCancel={() => setPendingAction(null)}
        onSubmit={(n) => {
          setName(n);
          const action = pendingAction;
          setPendingAction(null);
          if (action) void action.next(n);
        }}
      />
    </div>
  );
}
