import { describe, expect, it } from "vitest";
import { documentStorage } from "../src/services/storage.service";

describe("documentStorage", () => {
  it("returns documents sorted by uploadDate desc", () => {
    documentStorage.clear();

    documentStorage.save({
      id: "a",
      filename: "a.pdf",
      uploadDate: new Date("2020-01-01T00:00:00Z"),
      size: 100,
      summary: "a",
      keyPoints: [],
      fullText: "A",
    });

    documentStorage.save({
      id: "b",
      filename: "b.pdf",
      uploadDate: new Date("2021-01-01T00:00:00Z"),
      size: 200,
      summary: "b",
      keyPoints: [],
      fullText: "B",
    });

    const all = documentStorage.getAll();
    expect(all.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("getById returns undefined for missing doc", () => {
    documentStorage.clear();
    expect(documentStorage.getById("missing")).toBeUndefined();
  });

  it("delete removes a document", () => {
    documentStorage.clear();
    documentStorage.save({
      id: "x",
      filename: "x.pdf",
      uploadDate: new Date("2020-01-01T00:00:00Z"),
      size: 1,
      summary: "x",
      keyPoints: [],
      fullText: "x",
    });

    expect(documentStorage.delete("x")).toBe(true);
    expect(documentStorage.getById("x")).toBeUndefined();
    expect(documentStorage.delete("x")).toBe(false);
  });
});
