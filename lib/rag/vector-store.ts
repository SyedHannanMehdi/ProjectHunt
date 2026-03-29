/**
 * In-memory vector store for project embeddings.
 * On first load it fetches all projects from the DB, embeds them,
 * and caches them. Subsequent queries search the cache.
 *
 * In production you'd swap this for pgvector, Pinecone, or Weaviate.
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding, cosineSimilarity, projectToText } from "./embeddings";

export interface ProjectVector {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  tags: string[];
  techStack: string[];
  category: string | null;
  slug: string;
  logoUrl: string | null;
  upvoteCount: number;
  embedding: number[];
}

// Module-level cache (survives across requests in the same process)
let cachedVectors: ProjectVector[] | null = null;
let cacheBuiltAt: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getProjectVectors(): Promise<ProjectVector[]> {
  const now = new Date();
  if (
    cachedVectors &&
    cacheBuiltAt &&
    now.getTime() - cacheBuiltAt.getTime() < CACHE_TTL_MS
  ) {
    return cachedVectors;
  }

  // Fetch all published projects
  const projects = await prisma.project.findMany({
    where: { status: "published" },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      tags: true,
      techStack: true,
      category: true,
      slug: true,
      logoUrl: true,
      _count: { select: { upvotes: true } },
    },
  });

  // Generate embeddings in parallel (batches of 10 to avoid rate limits)
  const vectors: ProjectVector[] = [];
  const BATCH = 10;
  for (let i = 0; i < projects.length; i += BATCH) {
    const batch = projects.slice(i, i + BATCH);
    const embeddings = await Promise.all(
      batch.map((p) =>
        generateEmbedding(
          projectToText({
            name: p.name,
            tagline: p.tagline,
            description: p.description,
            tags: p.tags,
            techStack: p.techStack,
            category: p.category,
          })
        )
      )
    );
    batch.forEach((p, idx) => {
      vectors.push({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        tags: p.tags,
        techStack: p.techStack,
        category: p.category,
        slug: p.slug,
        logoUrl: p.logoUrl,
        upvoteCount: p._count.upvotes,
        embedding: embeddings[idx],
      });
    });
  }

  cachedVectors = vectors;
  cacheBuiltAt = now;
  return vectors;
}

/**
 * Find the top-k projects most similar to a query embedding.
 */
export async function searchProjects(
  queryEmbedding: number[],
  topK = 5
): Promise<(Omit<ProjectVector, "embedding"> & { score: number })[]> {
  const vectors = await getProjectVectors();

  const scored = vectors.map((v) => ({
    id: v.id,
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    tags: v.tags,
    techStack: v.techStack,
    category: v.category,
    slug: v.slug,
    logoUrl: v.logoUrl,
    upvoteCount: v.upvoteCount,
    score: cosineSimilarity(queryEmbedding, v.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((r) => r.score > 0.3); // relevance threshold
}

/**
 * Invalidate the cache (call after a new project is created/updated).
 */
export function invalidateVectorCache() {
  cachedVectors = null;
  cacheBuiltAt = null;
}
