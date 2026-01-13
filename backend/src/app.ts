import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route";
import documentRoutes from "./routes/document.route";
import qaRoutes from "./routes/qa.route";
import compareRoutes from "./routes/compare.route";
import { initAuthDb } from "./services/authDb.service";

export function createApp(options?: { dbPath?: string }) {
  const app = express();

  initAuthDb({ dbPath: options?.dbPath });

  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    console.log("✅ Health check received from frontend");
    res.json({
      status: "ok",
      message: "Backend server is running",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/qa", qaRoutes);
  app.use("/api/compare", compareRoutes);

  return app;
}
