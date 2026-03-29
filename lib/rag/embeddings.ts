import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding vector for a given text using OpenAI.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build a textual representation of a project for embedding.
 */
export function projectToText(project: {
  name: string;
  tagline?: string | null;
  description?: string | null;
  tags?: string[] | null;
  techStack?: string[] | null;
  category?: string | null;
}): string {
  const parts: string[] = [];
  parts.push(`Project: ${project.name}`);
  if (project.tagline) parts.push(`Tagline: ${project.tagline}`);
  if (project.description) parts.push(`Description: ${project.description}`);
  if (project.category) parts.push(`Category: ${project.category}`);
  if (project.tags && project.tags.length > 0)
    parts.push(`Tags: ${project.tags.join(", ")}`);
  if (project.techStack && project.techStack.length > 0)
    parts.push(`Tech Stack: ${project.techStack.join(", ")}`);
  return parts.join(". ");
}
