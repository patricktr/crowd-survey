import { getAdminToken, jsonError } from "@/lib/api";
import {
  getBoard,
  listQuestionsWithAgreements,
  verifyAdmin,
} from "@/lib/queries";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]/export">
) {
  const { id } = await ctx.params;
  const token = getAdminToken(request);
  if (!token || !(await verifyAdmin(id, token))) {
    return jsonError("Unauthorized", 401);
  }

  const board = await getBoard(id);
  if (!board) return jsonError("Board not found", 404);

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const questions = await listQuestionsWithAgreements(id);
  const safeName = board.title.replace(/[^a-z0-9-]+/gi, "_").slice(0, 60);

  if (format === "md" || format === "markdown") {
    const lines: string[] = [];
    lines.push(`# ${board.title}`);
    if (board.description) lines.push("", board.description);
    lines.push("", `_Exported ${new Date().toISOString()}_`, "");
    if (questions.length === 0) {
      lines.push("_(no questions yet)_");
    }
    for (const q of questions) {
      lines.push(`## ${q.body}`);
      lines.push(
        `**By:** ${q.authorName} · **Posted:** ${q.createdAt} · **Agreements:** ${q.agreements.length}`
      );
      if (q.agreements.length > 0) {
        lines.push("");
        lines.push(
          "Agreed by: " + q.agreements.map((a) => a.name).join(", ")
        );
      }
      lines.push("");
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.md"`,
      },
    });
  }

  // CSV (default)
  const header = [
    "question_id",
    "author",
    "posted_at",
    "body",
    "agreement_count",
    "agreed_by",
  ];
  const rows = [header.map(escapeCsv).join(",")];
  for (const q of questions) {
    rows.push(
      [
        q.id,
        q.authorName,
        q.createdAt,
        q.body,
        String(q.agreements.length),
        q.agreements.map((a) => a.name).join("; "),
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.csv"`,
    },
  });
}
