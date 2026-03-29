/**
 * In-memory vector store for ProjectHunt RAG model.
 *
 * Stores project embeddings and supports similarity-based retrieval.
 * In production, this can be swapped for Pinecone, pgvector, or Supabase
 * vector extensions by replacing the VectorStore class below.
 */

import { cosineSimilarity } from "./embeddings";

export interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface RetrievedDocument {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

class InMemoryVectorStore {
  private documents: Map<string, VectorDocument> = new Map();

  /** Insert or update a document. */
  upsert(doc: VectorDocument): void {
    this.documents.set(doc.id, doc);
  }

  /** Remove a document by id. */
  delete(id: string): void {
    this.documents.delete(id);
  }

  /** Return the top-k most similar documents to the query embedding. */
  query(queryEmbedding: number[], topK = 5): RetrievedDocument[] {
    const scored: RetrievedDocument[] = [];

    for (const doc of this.documents.values()) {
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      scored.push({ id: doc.id, text: doc.text, score, metadata: doc.metadata });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /** Return the total number of documents indexed. */
  size(): number {
    return this.documents.size;
  }

  /** Clear all documents (useful for re-indexing). */
  clear(): void {
    this.documents.clear();
  }
}

// Singleton — shared across the Next.js process (HMR-safe via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __projectHuntVectorStore: InMemoryVectorStore | undefined;
}

export const vectorStore: InMemoryVectorStore =
  globalThis.__projectHuntVectorStore ??
  (globalThis.__projectHuntVectorStore = new InMemoryVectorStore());
