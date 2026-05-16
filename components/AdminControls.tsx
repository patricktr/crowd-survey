"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Board } from "@/lib/queries";
import { useAdminBoards } from "@/lib/client-store";

export function AdminControls({
  board,
  adminToken,
  isOwnBoard,
  onChange,
}: {
  board: Board;
  adminToken: string;
  isOwnBoard: boolean;
  onChange: (next: Partial<Board>) => void;
}) {
  const router = useRouter();
  const admin = useAdminBoards();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = `/api/boards/${board.id}`;

  async function saveEdits(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const updated: Board = await res.json();
      onChange(updated);
      if (isOwnBoard) {
        admin.add({
          boardId: board.id,
          title: updated.title,
          adminToken,
          createdAt: board.createdAt,
        });
      }
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleClosed() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ closed: !board.closed }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: Board = await res.json();
      onChange(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteBoard() {
    if (
      !window.confirm(
        `Delete board "${board.title}"? This deletes all its questions and agreements. This can't be undone.`
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      if (isOwnBoard) admin.remove(board.id);
      router.push(isOwnBoard ? "/admin" : "/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function exportFile(format: "csv" | "md") {
    const url = `${apiUrl}/export?format=${format}`;
    fetch(url, { headers: { "x-admin-token": adminToken } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition") ?? "";
        const match = disposition.match(/filename="?([^";]+)"?/);
        const filename = match?.[1] ?? `board.${format}`;
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      })
      .catch((err) => setError((err as Error).message));
  }

  return (
    <section
      aria-label="Admin controls"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
          {isOwnBoard
            ? "You created this board"
            : "Superadmin access"}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            disabled={busy}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-[var(--background)]"
          >
            {editing ? "Cancel" : "Edit title/description"}
          </button>
          <button
            type="button"
            onClick={toggleClosed}
            disabled={busy}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-[var(--background)]"
          >
            {board.closed ? "Reopen board" : "Close board"}
          </button>
          <button
            type="button"
            onClick={() => exportFile("csv")}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-[var(--background)]"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportFile("md")}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-[var(--background)]"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={deleteBoard}
            disabled={busy}
            className="rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-2.5 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Delete board
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveEdits} className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Description (optional)"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm resize-y"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
