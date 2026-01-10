import { Request, Response } from "express";
import { askClaude } from "../services/claude.service";
import { documentStorage } from "../services/storage.service";

export async function compareDocuments(req: Request, res: Response) {
  try {
    const { docIdA, docIdB } = req.body;

    // Get documents from storage
    const docA = documentStorage.getById(docIdA);
    const docB = documentStorage.getById(docIdB);

    if (!docA || !docB) {
      return res.status(404).json({ error: "One or both documents not found" });
    }

    const prompt = `
You are a compliance gap analysis expert. Compare these two compliance documents and provide a detailed gap analysis.

Document A: ${docA.filename}
${docA.fullText.substring(0, 6000)}

Document B: ${docB.filename}
${docB.fullText.substring(0, 6000)}

Provide a comprehensive analysis in the following format:
1. **Missing Requirements**: List requirements present in Document B but missing in Document A
2. **Compliance Gaps**: Identify areas where Document A falls short of Document B's standards
3. **Key Differences**: Highlight major differences in approach or standards
4. **Recommendations**: Suggest specific actions to close identified gaps

Be specific and cite relevant sections where possible.
`;

    const result = await askClaude(prompt);

    res.json({
      comparison: {
        documentA: { id: docA.id, filename: docA.filename },
        documentB: { id: docB.id, filename: docB.filename },
        analysis: result,
      },
    });
  } catch (error) {
    console.error("Error comparing documents:", error);
    res.status(500).json({ error: "Failed to compare documents" });
  }
}
