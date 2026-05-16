import { getAdminToken, jsonError } from "@/lib/api";
import {
  isSuperadmin,
  listAllBoardsWithStats,
  listAllPeopleWithStats,
} from "@/lib/queries";

export async function GET(request: Request) {
  const token = getAdminToken(request);
  if (!isSuperadmin(token)) return jsonError("Unauthorized", 401);

  const [boards, people] = await Promise.all([
    listAllBoardsWithStats(),
    listAllPeopleWithStats(),
  ]);

  return Response.json(
    { boards, people },
    { headers: { "Cache-Control": "no-store" } }
  );
}
