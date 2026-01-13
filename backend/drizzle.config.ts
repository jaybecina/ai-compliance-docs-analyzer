import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.join(__dirname, ".env") });

const sqlitePath = process.env.SQLITE_DB_PATH?.trim() || "data/app.sqlite";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath,
  },
});
