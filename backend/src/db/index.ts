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
  const resolved = dbPath?.trim()
    ? dbPath.trim()
    : path.join(process.cwd(), "backend", "data", "app.sqlite");

  if (resolved === ":memory:") return resolved;

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return resolved;
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
