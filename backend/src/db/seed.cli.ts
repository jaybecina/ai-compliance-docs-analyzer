import path from "path";
import dotenv from "dotenv";
import { createDbContext } from "./index";
import { applyMigrationsOrEnsureSchema } from "./migrations";
import { seedUsersFromEnv } from "./seed";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const ctx = createDbContext(process.env.SQLITE_DB_PATH);

  const migrated = applyMigrationsOrEnsureSchema(ctx);

  seedUsersFromEnv(ctx.db);

  ctx.sqlite.close();

  const dbPath =
    process.env.SQLITE_DB_PATH?.trim() || "backend/data/app.sqlite";

  console.log(
    `✅ Seed complete (${migrated.mode}). DB: ${dbPath}. Set SEED_USERS_JSON to control seeded accounts.`
  );
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exitCode = 1;
});
