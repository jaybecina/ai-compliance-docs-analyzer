import "./loadEnv";

import { createApp } from "./app";

const app = createApp();

// Vercel (@vercel/node) expects the module to export a handler (Express app is supported).
// For local dev, allow running `ts-node src/server.ts` to start a listener.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDirectRun =
  typeof require !== "undefined" && (require as any).main === module;
if (isDirectRun) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
