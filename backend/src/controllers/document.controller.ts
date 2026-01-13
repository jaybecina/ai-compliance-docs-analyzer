import { Request, Response } from "express";
import { extractPdfText } from "../services/pdf.service";
import { chunkText } from "../utils/chunkText";
import { embeddings } from "../services/embedding.service";
import { index } from "../services/pinecone.service";
import { askClaude } from "../services/claude.service";
import { documentStorage } from "../services/storage.service";
import crypto from "crypto";

export async function uploadDocument(req: Request, res: Response) {
  try {
    console.log("📄 Upload request received");

    if (!req.file) {
      console.error("❌ No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    console.log(
      `📁 Processing file: ${file.originalname}, size: ${file.size} bytes`
    );

    console.log("🔍 Extracting PDF text...");
    const text = await extractPdfText(file.buffer);
    console.log(`✅ Extracted ${text.length} characters`);

    console.log("✂️ Chunking text...");
    const chunks = chunkText(text);
    console.log(`✅ Created ${chunks.length} chunks`);

    const docId = crypto.randomUUID();
    console.log(`🆔 Document ID: ${docId}`);

    // Generate summary and key points
    const summaryPrompt = `
You are a compliance document analyst. Analyze the following document and provide:
1. A concise summary (2-3 sentences)
2. 5-7 key points or requirements

Document:
${text.substring(0, 8000)}

Format your response as JSON:
{
  "summary": "your summary here",
  "keyPoints": ["point 1", "point 2", ...]
}
`;

    const analysisResponse = await askClaude(summaryPrompt);
    let summary = "Document uploaded successfully";
    let keyPoints: string[] = [];

    try {
      const analysis = JSON.parse(analysisResponse);
      summary = analysis.summary;
      keyPoints = analysis.keyPoints;
    } catch (e) {
      // If JSON parsing fails, extract manually
      summary = analysisResponse.substring(0, 200);
      keyPoints = ["Analysis pending"];
    }

    // Store vectors in Pinecone
    const vectors = await Promise.all(
      chunks.map(async (chunk) => ({
        id: crypto.randomUUID(),
        values: await embeddings.embedQuery(chunk),
        metadata: { text: chunk, filename: file.originalname, docId },
      }))
    );

    await index.upsert(vectors);

    // Store document metadata
    documentStorage.save({
      id: docId,
      filename: file.originalname,
      uploadDate: new Date(),
      size: file.size,
      summary,
      keyPoints,
      fullText: text,
    });

    res.json({
      message: "Document processed successfully",
      document: {
        id: docId,
        filename: file.originalname,
        size: file.size,
        summary,
        keyPoints,
        chunks: chunks.length,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading document:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({
      error: "Failed to process document",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getAllDocuments(req: Request, res: Response) {
  try {
    const documents = documentStorage.getAll().map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      uploadDate: doc.uploadDate,
      size: doc.size,
      summary: doc.summary,
      keyPoints: doc.keyPoints,
    }));

    res.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
}

export async function getDocumentById(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const document = documentStorage.getById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
}
