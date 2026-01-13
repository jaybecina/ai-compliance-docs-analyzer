import { Pinecone } from "@pinecone-database/pinecone";

let cached: {
  pinecone: Pinecone;
  index: ReturnType<Pinecone["index"]>;
} | null = null;

export function getPinecone() {
  if (cached) return cached;

  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey || !apiKey.trim()) {
    throw new Error("Pinecone is not configured (missing PINECONE_API_KEY).");
  }
  if (!indexName || !indexName.trim()) {
    throw new Error("Pinecone is not configured (missing PINECONE_INDEX).");
  }

  const pinecone = new Pinecone({ apiKey: apiKey.trim() });
  const index = pinecone.index(indexName.trim());
  cached = { pinecone, index };
  return cached;
}

export function getIndex() {
  return getPinecone().index;
}
