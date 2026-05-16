import { readJson } from "@/lib/api";
import { createBoard } from "@/lib/queries";
import { createBoardSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = await readJson(request, createBoardSchema);
  if (!parsed.ok) return parsed.response;

  const description =
    parsed.data.description && parsed.data.description.length > 0
      ? parsed.data.description
      : null;

  const board = await createBoard({
    title: parsed.data.title,
    description,
  });
  return Response.json(board, { status: 201 });
}
