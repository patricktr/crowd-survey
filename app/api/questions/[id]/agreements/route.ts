import { jsonError, readJson } from "@/lib/api";
import {
  addAgreement,
  getQuestionBoardId,
  getBoard,
  removeAgreement,
} from "@/lib/queries";
import { toggleAgreementSchema, nameSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/questions/[id]/agreements">
) {
  const { id } = await ctx.params;
  const boardId = await getQuestionBoardId(id);
  if (!boardId) return jsonError("Question not found", 404);

  const board = await getBoard(boardId);
  if (!board) return jsonError("Question not found", 404);
  if (board.closed) return jsonError("Board is closed", 409);

  const parsed = await readJson(request, toggleAgreementSchema);
  if (!parsed.ok) return parsed.response;

  const status = await addAgreement({
    questionId: id,
    name: parsed.data.name,
  });
  return Response.json({ status }, { status: status === "added" ? 201 : 200 });
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/questions/[id]/agreements">
) {
  const { id } = await ctx.params;
  const boardId = await getQuestionBoardId(id);
  if (!boardId) return jsonError("Question not found", 404);

  const url = new URL(request.url);
  const nameParam = url.searchParams.get("name") ?? "";
  const parsedName = nameSchema.safeParse(nameParam);
  if (!parsedName.success) return jsonError("Missing or invalid name", 400);

  await removeAgreement({ questionId: id, name: parsedName.data });
  return new Response(null, { status: 204 });
}
