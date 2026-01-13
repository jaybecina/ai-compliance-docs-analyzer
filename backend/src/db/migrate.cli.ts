import path from "path";
import dotenv from "dotenv";
import { createDbContext } from "./index";
import { applyMigrationsOrEnsureSchema } from "./migrations";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  const ctx = createDbContext(process.env.SQLITE_DB_PATH);
  const result = applyMigrationsOrEnsureSchema(ctx);
  ctx.sqlite.close();

  const dbPath = process.env.SQLITE_DB_PATH?.trim() || "data/app.sqlite";
  console.log(`✅ Migrations complete (${result.mode}). DB: ${dbPath}`);
}

main().catch((err) => {
  console.error("❌ Migrations failed:", err);
  process.exitCode = 1;
});
