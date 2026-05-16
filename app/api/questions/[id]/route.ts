import { getAdminToken, jsonError } from "@/lib/api";
import {
  deleteQuestion,
  getQuestionBoardId,
  verifyAdmin,
} from "@/lib/queries";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/questions/[id]">
) {
  const { id } = await ctx.params;
  const boardId = await getQuestionBoardId(id);
  if (!boardId) return jsonError("Question not found", 404);

  const token = getAdminToken(request);
  if (!token || !(await verifyAdmin(boardId, token))) {
    return jsonError("Unauthorized", 401);
  }

  await deleteQuestion(id);
  return new Response(null, { status: 204 });
}
