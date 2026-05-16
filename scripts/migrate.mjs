#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(here, "..", "db", "schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing POSTGRES_URL (or DATABASE_URL) in env.");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
try {
  await client.unsafe(sql);
  console.log("Schema applied.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
