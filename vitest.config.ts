import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["backend/tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage/backend",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ["backend/src/**/*.ts"],
      exclude: [
        "backend/src/server.ts",
        "backend/src/app.ts",
        "backend/src/config/**",
        "backend/src/services/claude.service.ts",
        "backend/src/services/embedding.service.ts",
        "backend/src/services/pdf.service.ts",
        "backend/src/services/pinecone.service.ts",
        "backend/src/db/*.cli.ts",
        "backend/src/**/__mocks__/**",
      ],
    },
  },
});
