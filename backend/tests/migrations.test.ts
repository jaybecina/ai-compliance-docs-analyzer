import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { createDbContext } from "../src/db";
import { applyMigrationsOrEnsureSchema } from "../src/db/migrations";

function makeTempDir(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe("applyMigrationsOrEnsureSchema", () => {
  it("falls back to ensureSchema when no drizzle journal exists", () => {
    const originalCwd = process.cwd();
    const tmp = makeTempDir("ai-compliance-nojournal-");

    try {
      process.chdir(tmp);

      const dbPath = path.join(tmp, "app.sqlite");
      const ctx = createDbContext(dbPath);

      const result = applyMigrationsOrEnsureSchema(ctx);
      expect(result.mode).toBe("ensureSchema");

      const tables = ctx.sqlite
        .prepare("select name from sqlite_master where type='table'")
        .all()
        .map((r: any) => r.name);
      expect(tables).toContain("users");

      ctx.sqlite.close();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("baselines an existing DB and does not re-run CREATE TABLE", () => {
    const originalCwd = process.cwd();
    const tmp = makeTempDir("ai-compliance-baseline-");

    try {
      // Create a fake migrations folder structure:
      // backend/drizzle/meta/_journal.json
      // backend/drizzle/0000_init.sql
      const migrationsFolder = path.join(tmp, "backend", "drizzle");
      fs.mkdirSync(path.join(migrationsFolder, "meta"), { recursive: true });

      const tag = "0000_init";
      const when = 1700000000000;

      fs.writeFileSync(
        path.join(migrationsFolder, "meta", "_journal.json"),
        JSON.stringify(
          {
            version: "7",
            dialect: "sqlite",
            entries: [{ idx: 0, version: "6", when, tag, breakpoints: true }],
          },
          null,
          2
        )
      );

      // This is the same shape as drizzle-kit output: it creates users.
      const migrationSql = `CREATE TABLE \`users\` (\n  \`id\` text PRIMARY KEY NOT NULL,\n  \`username\` text NOT NULL,\n  \`name\` text NOT NULL,\n  \`role\` text NOT NULL,\n  \`password_hash\` text NOT NULL,\n  \`created_at_ms\` integer NOT NULL\n);\n`;
      fs.writeFileSync(
        path.join(migrationsFolder, `${tag}.sql`),
        migrationSql,
        "utf8"
      );

      // Create an existing DB with users already present (simulates old ensureSchema bootstrapping)
      const dbPath = path.join(tmp, "app.sqlite");
      const sqlite = new Database(dbPath);
      sqlite.exec(migrationSql);
      sqlite.close();

      process.chdir(tmp);

      const ctx = createDbContext(dbPath);
      const result = applyMigrationsOrEnsureSchema(ctx);
      expect(result.mode).toBe("migrate");

      const rows = ctx.sqlite
        .prepare('select hash, created_at from "__drizzle_migrations"')
        .all() as Array<{ hash: string; created_at: number }>;
      expect(rows.length).toBe(1);
      expect(rows[0].created_at).toBe(when);

      // Calling again should not insert a second row.
      applyMigrationsOrEnsureSchema(ctx);
      const rows2 = ctx.sqlite
        .prepare('select hash, created_at from "__drizzle_migrations"')
        .all() as Array<{ hash: string; created_at: number }>;
      expect(rows2.length).toBe(1);

      ctx.sqlite.close();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("runs migrate on a fresh DB when migrations exist", () => {
    const originalCwd = process.cwd();
    const tmp = makeTempDir("ai-compliance-freshmigrate-");

    try {
      const migrationsFolder = path.join(tmp, "backend", "drizzle");
      fs.mkdirSync(path.join(migrationsFolder, "meta"), { recursive: true });

      const tag = "0000_init";
      fs.writeFileSync(
        path.join(migrationsFolder, "meta", "_journal.json"),
        JSON.stringify(
          {
            version: "7",
            dialect: "sqlite",
            entries: [{ idx: 0, version: "6", when: 1700000000000, tag }],
          },
          null,
          2
        )
      );

      const migrationSql = `CREATE TABLE \`users\` (\n  \`id\` text PRIMARY KEY NOT NULL,\n  \`username\` text NOT NULL,\n  \`name\` text NOT NULL,\n  \`role\` text NOT NULL,\n  \`password_hash\` text NOT NULL,\n  \`created_at_ms\` integer NOT NULL\n);\n`;
      fs.writeFileSync(
        path.join(migrationsFolder, `${tag}.sql`),
        migrationSql,
        "utf8"
      );

      process.chdir(tmp);

      const dbPath = path.join(tmp, "app.sqlite");
      const ctx = createDbContext(dbPath);
      const result = applyMigrationsOrEnsureSchema(ctx);
      expect(result.mode).toBe("migrate");

      const tables = ctx.sqlite
        .prepare("select name from sqlite_master where type='table'")
        .all()
        .map((r: any) => r.name);
      expect(tables).toContain("users");
      expect(tables).toContain("__drizzle_migrations");

      ctx.sqlite.close();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
