import { getAdminToken, jsonError, readJson } from "@/lib/api";
import {
  deleteBoard,
  getBoard,
  listQuestionsWithAgreements,
  updateBoard,
  verifyAdmin,
} from "@/lib/queries";
import { updateBoardSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]">
) {
  const { id } = await ctx.params;
  const board = await getBoard(id);
  if (!board) return jsonError("Board not found", 404);

  const token = getAdminToken(request);
  const isAdmin = token ? await verifyAdmin(id, token) : false;
  const questions = await listQuestionsWithAgreements(id);

  return Response.json(
    { board, questions, isAdmin },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]">
) {
  const { id } = await ctx.params;
  const token = getAdminToken(request);
  if (!token || !(await verifyAdmin(id, token))) {
    return jsonError("Unauthorized", 401);
  }

  const parsed = await readJson(request, updateBoardSchema);
  if (!parsed.ok) return parsed.response;

  const patch: {
    title?: string;
    description?: string | null;
    closed?: boolean;
  } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.description !== undefined) {
    patch.description =
      parsed.data.description.length > 0 ? parsed.data.description : null;
  }
  if (parsed.data.closed !== undefined) patch.closed = parsed.data.closed;

  const updated = await updateBoard(id, patch);
  if (!updated) return jsonError("Board not found", 404);
  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/boards/[id]">
) {
  const { id } = await ctx.params;
  const token = getAdminToken(request);
  if (!token || !(await verifyAdmin(id, token))) {
    return jsonError("Unauthorized", 401);
  }
  await deleteBoard(id);
  return new Response(null, { status: 204 });
}
