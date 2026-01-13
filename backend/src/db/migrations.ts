import path from "path";
import fs from "fs";
import crypto from "crypto";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { DbContext, SqliteDb } from "./index";
import { ensureSchema } from "./index";

function tableExists(sqlite: SqliteDb, tableName: string) {
  const row = sqlite
    .prepare(
      "select name from sqlite_master where type='table' and name = ? limit 1"
    )
    .get(tableName) as { name?: string } | undefined;

  return Boolean(row?.name);
}

function baselineExistingDb(sqlite: SqliteDb, migrationsFolder: string) {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) return;

  const journalRaw = fs.readFileSync(journalPath, "utf8");
  const journal = JSON.parse(journalRaw) as {
    entries: Array<{ tag: string; when: number }>;
  };

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    );
  `);

  const insert = sqlite.prepare(
    `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)`
  );

  for (const entry of journal.entries ?? []) {
    const sqlPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) continue;

    const sql = fs.readFileSync(sqlPath, "utf8");
    const hash = crypto.createHash("sha256").update(sql).digest("hex");

    const already = sqlite
      .prepare(
        `select 1 as ok from "__drizzle_migrations" where hash = ? limit 1`
      )
      .get(hash) as { ok?: number } | undefined;

    if (already?.ok) continue;

    insert.run(hash, entry.when ?? Date.now());
  }
}

export function applyMigrationsOrEnsureSchema(ctx: DbContext) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  // If no generated migrations exist yet, keep the old behavior.
  if (!fs.existsSync(journalPath)) {
    ensureSchema(ctx.sqlite);
    return { mode: "ensureSchema" as const };
  }

  const hasUsers = tableExists(ctx.sqlite, "users");

  // If the DB already has tables (e.g. created by older ensureSchema bootstrapping),
  // baseline migrations so migrate() doesn't fail on "table already exists".
  if (hasUsers) {
    baselineExistingDb(ctx.sqlite, migrationsFolder);
  }

  migrate(ctx.db, { migrationsFolder });
  return { mode: "migrate" as const, migrationsFolder };
}
