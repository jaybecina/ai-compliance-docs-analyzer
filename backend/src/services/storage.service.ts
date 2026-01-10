// In-memory storage for documents
export interface Document {
  id: string;
  filename: string;
  uploadDate: Date;
  size: number;
  summary: string;
  keyPoints: string[];
  fullText: string;
}

class DocumentStorage {
  private documents: Map<string, Document> = new Map();

  save(document: Document): void {
    this.documents.set(document.id, document);
  }

  getById(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getAll(): Document[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
    );
  }

  delete(id: string): boolean {
    return this.documents.delete(id);
  }

  clear(): void {
    this.documents.clear();
  }
}

export const documentStorage = new DocumentStorage();
