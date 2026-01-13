import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.route";

function lazyRouter(
  loader: () => Promise<{ default: express.Router }>
): express.RequestHandler {
  let cached: express.Router | null = null;
  let loading: Promise<express.Router> | null = null;

  return async (req, res, next) => {
    try {
      if (!cached) {
        if (!loading) loading = loader().then((m) => m.default);
        cached = await loading;
      }
      // Express Router is a callable middleware.
      return (cached as unknown as express.RequestHandler)(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

export function createApp(options?: { dbPath?: string }) {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  // API router: all endpoints live under /api/*
  const api = express.Router();

  // Lightweight health checks that should not depend on DB/env/external services.
  api.use("/health", healthRoutes);

  // Lazy-load heavier routes so serverless health checks don't crash
  // due to missing env vars or native dependencies during cold start.
  api.use(
    "/auth",
    lazyRouter(() => import("./routes/auth.route"))
  );
  api.use(
    "/documents",
    lazyRouter(() => import("./routes/document.route"))
  );
  api.use(
    "/qa",
    lazyRouter(() => import("./routes/qa.route"))
  );
  api.use(
    "/compare",
    lazyRouter(() => import("./routes/compare.route"))
  );

  app.use("/api", api);

  // Optional alias used by some uptime checks.
  app.use("/health", healthRoutes);

  // Final error handler: ensures serverless errors return JSON.
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Unhandled error:", err);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: message });
    }
  );

  return app;
}
