import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load backend env so drizzle-kit uses the same DB path as the app.
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

const sqlitePath =
  process.env.SQLITE_DB_PATH?.trim() || "backend/data/app.sqlite";

export default defineConfig({
  schema: "./backend/src/db/schema.ts",
  out: "./backend/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath,
  },
});
