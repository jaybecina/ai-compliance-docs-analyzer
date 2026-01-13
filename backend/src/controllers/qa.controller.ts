import { Request, Response } from "express";
import { embeddings } from "../services/embedding.service";
import { getIndex, isPineconeConfigured } from "../services/pinecone.service";
import { askClaude } from "../services/claude.service";

export async function askQuestion(req: Request, res: Response) {
  try {
    const { question, docId } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!isPineconeConfigured()) {
      return res.status(503).json({
        error: "Vector search unavailable",
        details:
          "Pinecone is not configured (missing PINECONE_API_KEY/PINECONE_INDEX).",
      });
    }

    const queryEmbedding = await embeddings.embedQuery(question);

    // Build query filter if docId is provided
    const queryOptions: any = {
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    };

    if (docId) {
      queryOptions.filter = { docId: { $eq: docId } };
    }

    const index = getIndex();
    const results = await index.query(queryOptions);

    const context = results.matches
      ?.map((m) => m.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (!context) {
      return res.json({
        answer:
          "I couldn't find relevant information to answer your question. Please try rephrasing or ensure the document has been uploaded.",
      });
    }

    const prompt = `
You are a compliance assistant specialized in analyzing workplace safety and compliance documents.

Context from the documents:
${context}

Question: ${question}

Instructions:
- Answer ONLY based on the context provided above
- Be specific and cite relevant information from the context
- If the context doesn't contain enough information to answer, say so clearly
- Use clear, professional language
- Format your response in a structured way with bullet points if appropriate

Answer:`;

    const answer = await askClaude(prompt);

    res.json({
      answer,
      sources: results.matches?.length || 0,
    });
  } catch (error) {
    console.error("Error answering question:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
}
