/**
 * Index all projects into the vector store.
 *
 * Call this at startup (e.g. from a Next.js instrumentation hook) or
 * on-demand via the /api/rag/index route to keep the store up-to-date.
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding, buildProjectDocument } from "./embeddings";
import { vectorStore } from "./vectorStore";

export async function indexAllProjects(): Promise<number> {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      tags: true,
      techStack: true,
      user: {
        select: { name: true },
      },
    },
  });

  let indexed = 0;

  for (const project of projects) {
    try {
      const text = buildProjectDocument({
        name: project.name,
        tagline: project.tagline,
        description: project.description,
        tags: project.tags,
        techStack: project.techStack,
        creatorName: project.user?.name,
      });

      const embedding = await generateEmbedding(text);

      vectorStore.upsert({
        id: project.id,
        text,
        embedding,
        metadata: {
          id: project.id,
          name: project.name,
          tagline: project.tagline ?? "",
        },
      });

      indexed++;
    } catch (err) {
      console.error(`[RAG] Failed to index project ${project.id}:`, err);
    }
  }

  console.log(`[RAG] Indexed ${indexed}/${projects.length} projects`);
  return indexed;
}

/**
 * Index (or re-index) a single project by id.
 * Call this whenever a project is created or updated.
 */
export async function indexProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      tags: true,
      techStack: true,
      user: { select: { name: true } },
    },
  });

  if (!project) {
    vectorStore.delete(projectId);
    return;
  }

  const text = buildProjectDocument({
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    tags: project.tags,
    techStack: project.techStack,
    creatorName: project.user?.name,
  });

  const embedding = await generateEmbedding(text);

  vectorStore.upsert({
    id: project.id,
    text,
    embedding,
    metadata: {
      id: project.id,
      name: project.name,
      tagline: project.tagline ?? "",
    },
  });
}
