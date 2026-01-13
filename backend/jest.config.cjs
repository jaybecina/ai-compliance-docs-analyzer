/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  clearMocks: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "html", "json-summary"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/server.ts",
    "<rootDir>/src/app.ts",
    "<rootDir>/src/config/",
    "<rootDir>/src/services/claude.service.ts",
    "<rootDir>/src/services/embedding.service.ts",
    "<rootDir>/src/services/pdf.service.ts",
    "<rootDir>/src/services/pinecone.service.ts",
    "<rootDir>/src/db/.*\\.cli\\.ts$",
  ],
};
