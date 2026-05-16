import { jsonError, readJson } from "@/lib/api";
import { createQuestion, getBoard } from "@/lib/queries";
import { createQuestionSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]/questions">
) {
  const { id } = await ctx.params;
  const board = await getBoard(id);
  if (!board) return jsonError("Board not found", 404);
  if (board.closed) return jsonError("Board is closed", 409);

  const parsed = await readJson(request, createQuestionSchema);
  if (!parsed.ok) return parsed.response;

  const created = await createQuestion({
    boardId: id,
    authorName: parsed.data.authorName,
    body: parsed.data.body,
  });
  return Response.json(created, { status: 201 });
}
