"use client";

import { useEffect, useRef } from "react";

export function NameDialog({
  open,
  initialName,
  title,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  initialName?: string;
  title?: string;
  onCancel?: () => void;
  onSubmit: (name: string) => void;
}) {
  if (!open) return null;
  return (
    <NameDialogInner
      initialName={initialName}
      title={title}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
}

function NameDialogInner({
  initialName,
  title,
  onCancel,
  onSubmit,
}: {
  initialName?: string;
  title?: string;
  onCancel?: () => void;
  onSubmit: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = inputRef.current?.value ?? "";
          const cleaned = value.replace(/\s+/g, " ").trim();
          if (cleaned.length === 0) return;
          onSubmit(cleaned);
        }}
        className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold mb-2">
          {title ?? "What's your name?"}
        </h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          Shown next to your posts and agreements. Saved in this browser.
        </p>
        <input
          ref={inputRef}
          type="text"
          required
          maxLength={60}
          defaultValue={initialName ?? ""}
          placeholder="e.g. Patrick R."
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
