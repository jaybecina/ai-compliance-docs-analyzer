import type { DbContext } from "../db";
import { createDbContext, ensureSchema } from "../db";
import { seedUsersFromEnv } from "../db/seed";
import { applyMigrationsOrEnsureSchema } from "../db/migrations";

let ctx: DbContext | null = null;

export function initAuthDb(options?: { dbPath?: string }) {
  if (ctx) return ctx;

  ctx = createDbContext(options?.dbPath ?? process.env.SQLITE_DB_PATH);

  applyMigrationsOrEnsureSchema(ctx);

  seedUsersFromEnv(ctx.db);

  return ctx;
}

export function setAuthDbForTests(next: DbContext) {
  ctx = next;
}

export function getAuthDb() {
  if (!ctx) {
    return initAuthDb();
  }
  return ctx;
}
