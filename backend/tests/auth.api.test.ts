import { describe, expect, it, beforeEach, vi } from "vitest";
import request from "supertest";

// Mock external services so createApp can be imported without env vars
vi.mock("../src/services/pinecone.service", () => ({
  index: {
    upsert: vi.fn(async () => ({ upsertedCount: 1 })),
    query: vi.fn(async () => ({ matches: [] })),
  },
}));

vi.mock("../src/services/embedding.service", () => ({
  embeddings: {
    embedQuery: vi.fn(async () => Array.from({ length: 1024 }, () => 0)),
  },
}));

vi.mock("../src/services/pdf.service", () => ({
  extractPdfText: vi.fn(async () => "dummy"),
}));

vi.mock("../src/services/claude.service", () => ({
  askClaude: vi.fn(async () => "Mock AI"),
}));

import { createDbContext, ensureSchema, resolveSqlitePath } from "../src/db";
import { seedUsers } from "../src/db/seed";
import { setAuthDbForTests } from "../src/services/authDb.service";
import { users } from "../src/db/schema";

describe("Auth API", () => {
  beforeEach(() => {
    const ctx = createDbContext(":memory:");
    ensureSchema(ctx.sqlite);
    seedUsers(ctx.db, [
      {
        username: "admin",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      },
      {
        username: "analyst",
        password: "analyst123",
        name: "Compliance Analyst",
        role: "analyst",
      },
      {
        username: "demo",
        password: "demo123",
        name: "Demo User",
        role: "demo",
      },
    ]);
    setAuthDbForTests(ctx);
  });

  it("rejects invalid login payload", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    await request(app).post("/api/auth/login").send({}).expect(400);
  });

  it("allows seeded admin login", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" })
      .expect(200);

    expect(res.body.token).toBeTruthy();
    expect(res.body.user?.username).toBe("admin");
  });

  it("rejects wrong password", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong" })
      .expect(401);
  });

  it("registers a new user and allows login", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    const reg = await request(app)
      .post("/api/auth/register")
      .send({ username: "newuser", password: "password123", name: "New User" })
      .expect(201);

    expect(reg.body.token).toBeTruthy();
    expect(reg.body.user?.username).toBe("newuser");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "newuser", password: "password123" })
      .expect(200);

    expect(login.body.token).toBeTruthy();
    expect(login.body.user?.name).toBe("New User");
  });

  it("rejects duplicate registration", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    await request(app)
      .post("/api/auth/register")
      .send({ username: "demo", password: "whatever123" })
      .expect(409);
  });

  it("rejects invalid registration payload", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    await request(app)
      .post("/api/auth/register")
      .send({ username: "a", password: "b" })
      .expect(400);
  });
});

describe("SQLite path helpers", () => {
  it("passes through :memory:", () => {
    expect(resolveSqlitePath(":memory:")).toBe(":memory:");
  });

  it("resolves default path and creates directory", () => {
    const p = resolveSqlitePath(undefined);
    expect(p).toContain("backend/data/app.sqlite");
  });

  it("seeding is idempotent", () => {
    const ctx = createDbContext(":memory:");
    ensureSchema(ctx.sqlite);

    seedUsers(ctx.db, [
      {
        username: "admin",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      },
      {
        username: "analyst",
        password: "analyst123",
        name: "Compliance Analyst",
        role: "analyst",
      },
      {
        username: "demo",
        password: "demo123",
        name: "Demo User",
        role: "demo",
      },
    ]);
    seedUsers(ctx.db, [
      {
        username: "admin",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      },
      {
        username: "analyst",
        password: "analyst123",
        name: "Compliance Analyst",
        role: "analyst",
      },
      {
        username: "demo",
        password: "demo123",
        name: "Demo User",
        role: "demo",
      },
    ]);

    const all = ctx.db.select({ id: users.id }).from(users).all();
    expect(all.length).toBe(3);
  });
});
