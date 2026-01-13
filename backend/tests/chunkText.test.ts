import { describe, expect, it } from "@jest/globals";
import { chunkText } from "../src/utils/chunkText";

describe("chunkText", () => {
  it("returns at least one chunk", () => {
    const chunks = chunkText("hello", 500, 50);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe("hello");
  });

  it("creates overlapping chunks", () => {
    const text = "abcdefghijklmnopqrstuvwxyz";
    const chunks = chunkText(text, 10, 2);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toBe(text.slice(0, 10));
    // Next chunk starts at chunkSize - overlap
    expect(chunks[1].startsWith(text.slice(8, 10))).toBe(true);
  });

  it("handles empty input", () => {
    expect(chunkText("", 10, 2)).toEqual([]);
  });
});
