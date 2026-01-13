import { PDFParse } from "pdf-parse";
import { pathToFileURL } from "node:url";

function configurePdfWorker(): void {
  try {
    const workerPath = require.resolve(
      "pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
    );
    const workerSrc = pathToFileURL(workerPath).href;
    PDFParse.setWorker(workerSrc);
  } catch {
    // Best-effort: if resolution fails, pdf-parse/pdfjs will fall back to its defaults.
  }
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    configurePdfWorker();
    console.log(
      "PDF service: Starting extraction, buffer length:",
      buffer.length
    );
    // Convert Buffer to Uint8Array (required by pdf-parse 2.x)
    const uint8Array = new Uint8Array(buffer);
    console.log(
      "PDF service: Converted to Uint8Array, length:",
      uint8Array.length
    );

    // Serverless/Vercel: ensure the worker entrypoint is resolvable at runtime.
    // (Vercel bundling can otherwise cause "Setting up fake worker failed".)
    const parser = new PDFParse({ data: uint8Array });
    console.log("PDF service: Parser created, calling getText()");

    const data = await parser.getText();
    console.log(
      "PDF service: getText() successful, text length:",
      data.text.length
    );
    return data.text;
  } catch (error) {
    console.error("PDF parsing error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse PDF: ${message}`);
  }
}
