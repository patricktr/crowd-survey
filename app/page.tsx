import Link from "next/link";
import { NewBoardForm } from "@/components/NewBoardForm";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Start a board.
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Share the link with a group. People add questions, comments, or
          concerns and put their name on the ones they agree with. Not anonymous.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <NewBoardForm />
      </div>

      <p className="text-xs text-[var(--muted)]">
        Already created one?{" "}
        <Link href="/admin" className="underline underline-offset-2">
          See your boards
        </Link>
        .
      </p>
    </div>
  );
}
