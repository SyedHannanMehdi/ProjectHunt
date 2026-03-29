import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { searchProjects } from "@/lib/rag/vector-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const rawLimit = searchParams.get("limit");
    const DEFAULT_LIMIT = 5;
    const MAX_LIMIT = 20;

    let topK = DEFAULT_LIMIT;
    if (rawLimit !== null) {
      const parsedLimit = Number.parseInt(rawLimit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        topK = Math.min(parsedLimit, MAX_LIMIT);
      }
    }

    const queryEmbedding = await generateEmbedding(query);
    const results = await searchProjects(queryEmbedding, topK);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
