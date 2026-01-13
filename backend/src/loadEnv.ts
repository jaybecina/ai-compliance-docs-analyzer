import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// For local dev, load backend/.env.
// In production (e.g. Vercel), env vars are typically injected and this is a no-op.
const envPath = path.join(__dirname, "../.env");

// Vercel sets `VERCEL=1` (or similar) in the runtime.
// Do not rely on shipping a `.env` file to production.
if (!process.env.VERCEL && fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
