import { PDFParse } from "pdf-parse";

// Disable worker globally for serverless environments
// @ts-ignore - setting internal config
if (typeof globalThis !== "undefined" && !globalThis.pdfjsLib) {
  // @ts-ignore
  globalThis.PDFJS_WORKER_SRC = false;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
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

    const parser = new PDFParse(uint8Array);
    console.log(
      "PDF service: Parser created (worker disabled), calling getText()"
    );

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
    throw new Error("Failed to parse PDF");
  }
}
