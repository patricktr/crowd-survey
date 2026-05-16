import postgres from "postgres";

declare global {
  var __pg: ReturnType<typeof postgres> | undefined;
}

function connect(): ReturnType<typeof postgres> {
  const connectionString =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "Database connection string missing. Set POSTGRES_URL (or DATABASE_URL) in your env."
    );
  }
  return postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
  });
}

function pg(): ReturnType<typeof postgres> {
  if (!globalThis.__pg) globalThis.__pg = connect();
  return globalThis.__pg;
}

export const sql: ReturnType<typeof postgres> = new Proxy(
  function () {} as unknown as ReturnType<typeof postgres>,
  {
    get(_target, prop) {
      const client = pg() as unknown as Record<string | symbol, unknown>;
      const value = client[prop as string];
      return typeof value === "function" ? value.bind(client) : value;
    },
    apply(_target, _thisArg, argArray) {
      return (pg() as unknown as (...a: unknown[]) => unknown)(...argArray);
    },
  }
);
