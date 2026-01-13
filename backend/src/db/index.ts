import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type SqliteDb = Database.Database;
export type DrizzleDb = ReturnType<typeof drizzle>;

export type DbContext = {
  sqlite: SqliteDb;
  db: DrizzleDb;
};

export function resolveSqlitePath(dbPath: string | undefined) {
  const isVercel = process.env.VERCEL === "1";
  const trimmed = dbPath?.trim();

  // Vercel/Serverless file system is read-only except for /tmp.
  // If SQLITE_DB_PATH is relative (or missing), place the DB in /tmp.
  const resolved = trimmed
    ? trimmed
    : isVercel
    ? path.join("/tmp", "app.sqlite")
    : path.join(process.cwd(), "data", "app.sqlite");

  if (resolved === ":memory:") return resolved;

  const resolvedAbsolute = path.isAbsolute(resolved)
    ? resolved
    : isVercel
    ? path.join("/tmp", resolved)
    : path.join(process.cwd(), resolved);

  const dir = path.dirname(resolvedAbsolute);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return resolvedAbsolute;
}

export function createDbContext(dbPath?: string): DbContext {
  const sqlitePath = resolveSqlitePath(dbPath);
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite);

  return { sqlite, db };
}

export function ensureSchema(sqlite: SqliteDb) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL
    );
  `);
}
