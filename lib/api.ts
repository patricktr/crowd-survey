import { ZodError, type ZodType } from "zod";

export function jsonError(message: string, status = 400, extra?: object) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function readJson<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: jsonError("Invalid JSON body", 400),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const err = parsed.error as ZodError;
    return {
      ok: false,
      response: jsonError("Validation failed", 422, {
        issues: err.issues,
      }),
    };
  }
  return { ok: true, data: parsed.data };
}

export function getAdminToken(request: Request): string | null {
  return request.headers.get("x-admin-token");
}
