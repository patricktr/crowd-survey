"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminBoards } from "@/lib/client-store";

export function NewBoardForm() {
  const router = useRouter();
  const admin = useAdminBoards();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create board");
      }
      const board: {
        id: string;
        adminToken: string;
        title: string;
        createdAt: string;
      } = await res.json();
      admin.add({
        boardId: board.id,
        title: board.title,
        adminToken: board.adminToken,
        createdAt: board.createdAt,
      });
      router.push(`/b/${board.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">
          Title <span className="text-[var(--muted)]">(required)</span>
        </label>
        <input
          id="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Questions for March all-hands"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="description"
        >
          Description <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <textarea
          id="description"
          maxLength={2000}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this for? Any context for participants?"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm resize-y"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || title.trim().length === 0}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create board"}
      </button>
    </form>
  );
}
