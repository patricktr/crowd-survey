import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { constantTimeEqual } from "@/lib/crypto";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = await readJson(request, schema);
  if (!parsed.ok) return parsed.response;

  const expected = process.env.SUPERADMIN_TOKEN;
  if (!expected) {
    return jsonError("Superadmin not configured on this server", 501);
  }

  if (!constantTimeEqual(expected, parsed.data.token)) {
    return jsonError("Invalid token", 401);
  }

  return Response.json({ ok: true });
}
