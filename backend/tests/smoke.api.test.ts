import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the expensive/external dependencies used by controllers
vi.mock("../src/services/pdf.service", () => ({
  extractPdfText: vi.fn(
    async () =>
      "PPE is mandatory for working at heights. Fall arrest systems required."
  ),
}));

vi.mock("../src/services/claude.service", () => ({
  askClaude: vi.fn(async (prompt: string) => {
    // Upload expects JSON for summary/key points
    if (prompt.includes("Format your response as JSON")) {
      return JSON.stringify({
        summary: "Short summary of the compliance document.",
        keyPoints: ["PPE required", "Fall arrest", "Training"],
      });
    }
    return "Mock AI response";
  }),
}));

vi.mock("../src/services/embedding.service", () => ({
  embeddings: {
    embedQuery: vi.fn(async () => Array.from({ length: 1024 }, () => 0)),
  },
}));

const upsertMock = vi.fn(async () => ({ upsertedCount: 1 }));
const queryMock = vi.fn(async () => ({
  matches: [
    { metadata: { text: "PPE is mandatory for working at heights." } },
    { metadata: { text: "Fall arrest systems required." } },
  ],
}));

vi.mock("../src/services/pinecone.service", () => ({
  index: {
    upsert: upsertMock,
    query: queryMock,
  },
}));

describe("API smoke test", () => {
  beforeEach(async () => {
    upsertMock.mockClear();
    queryMock.mockClear();

    // Fresh in-memory auth DB for deterministic tests
    const { createDbContext, ensureSchema } = await import("../src/db");
    const { seedUsers } = await import("../src/db/seed");
    const { setAuthDbForTests } = await import(
      "../src/services/authDb.service"
    );

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

  it("covers common error cases", async () => {
    const { createApp } = await import("../src/app");
    const { documentStorage } = await import("../src/services/storage.service");
    documentStorage.clear();

    const app = createApp();

    // Auth branches
    await request(app).post("/api/auth/login").send({}).expect(400);
    await request(app)
      .post("/api/auth/login")
      .send({ username: "wrong", password: "wrong" })
      .expect(401);

    await request(app).post("/api/documents/upload").expect(400);
    await request(app).post("/api/qa/ask").send({}).expect(400);
    await request(app)
      .post("/api/compare")
      .send({ docIdA: "missing", docIdB: "missing" })
      .expect(404);
    await request(app).get("/api/documents/missing").expect(404);

    // QA 500 branch
    queryMock.mockRejectedValueOnce(new Error("pinecone down"));
    await request(app)
      .post("/api/qa/ask")
      .send({ question: "test" })
      .expect(500);
  });

  it("runs the core workflow", async () => {
    const { createApp } = await import("../src/app");
    const { documentStorage } = await import("../src/services/storage.service");
    documentStorage.clear();

    const app = createApp();

    // Health
    await request(app).get("/api/health").expect(200);

    // Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" })
      .expect(200);

    expect(loginRes.body.token).toBeTruthy();

    // Upload 2 docs
    const upload1 = await request(app)
      .post("/api/documents/upload")
      .attach("file", Buffer.from("%PDF-1.4\n%fake\n"), {
        filename: "doc-a.pdf",
        contentType: "application/pdf",
      })
      .expect(200);

    const upload2 = await request(app)
      .post("/api/documents/upload")
      .attach("file", Buffer.from("%PDF-1.4\n%fake\n"), {
        filename: "doc-b.pdf",
        contentType: "application/pdf",
      })
      .expect(200);

    const docIdA = upload1.body?.document?.id;
    const docIdB = upload2.body?.document?.id;
    expect(docIdA).toBeTruthy();
    expect(docIdB).toBeTruthy();
    expect(upsertMock).toHaveBeenCalled();

    // List
    const list = await request(app).get("/api/documents").expect(200);
    expect(Array.isArray(list.body.documents)).toBe(true);
    expect(list.body.documents.length).toBeGreaterThanOrEqual(2);

    // Detail
    const detail = await request(app)
      .get(`/api/documents/${docIdA}`)
      .expect(200);
    expect(detail.body.document.fullText).toContain("PPE");
    expect(detail.body.document.keyPoints.length).toBeGreaterThan(0);

    // Q&A
    const qa = await request(app)
      .post("/api/qa/ask")
      .send({ question: "What PPE is mandatory?", docId: docIdA })
      .expect(200);
    expect(qa.body.answer).toBeTruthy();
    expect(typeof qa.body.sources).toBe("number");
    expect(queryMock).toHaveBeenCalled();

    // Q&A without docId (covers optional filter branch)
    await request(app)
      .post("/api/qa/ask")
      .send({ question: "General question" })
      .expect(200);

    // Q&A with no context returned (covers empty-context branch)
    queryMock.mockResolvedValueOnce({ matches: [] });
    const noContext = await request(app)
      .post("/api/qa/ask")
      .send({ question: "What training is needed?" })
      .expect(200);
    expect(noContext.body.answer).toMatch(
      /couldn't find relevant information/i
    );

    // Compare
    const compare = await request(app)
      .post("/api/compare")
      .send({ docIdA, docIdB })
      .expect(200);
    expect(compare.body.comparison?.analysis).toBeTruthy();
  });

  it("uses fallback summary parsing when Claude returns non-JSON", async () => {
    const claude = await import("../src/services/claude.service");
    // @ts-expect-error test override
    claude.askClaude.mockResolvedValueOnce("Not JSON at all");

    const { createApp } = await import("../src/app");
    const { documentStorage } = await import("../src/services/storage.service");
    documentStorage.clear();

    const app = createApp();

    const upload = await request(app)
      .post("/api/documents/upload")
      .attach("file", Buffer.from("%PDF-1.4\n%fake\n"), {
        filename: "doc-c.pdf",
        contentType: "application/pdf",
      })
      .expect(200);

    expect(upload.body.document.summary).toBeTruthy();
  });

  it("returns 500 when PDF extraction fails", async () => {
    const pdf = await import("../src/services/pdf.service");
    // @ts-expect-error test override
    pdf.extractPdfText.mockImplementationOnce(async () => {
      throw new Error("boom");
    });

    const { createApp } = await import("../src/app");
    const { documentStorage } = await import("../src/services/storage.service");
    documentStorage.clear();

    const app = createApp();

    await request(app)
      .post("/api/documents/upload")
      .attach("file", Buffer.from("%PDF-1.4\n%fake\n"), {
        filename: "bad.pdf",
        contentType: "application/pdf",
      })
      .expect(500);
  });
});
