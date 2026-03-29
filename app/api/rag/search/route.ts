import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { searchProjects } from "@/lib/rag/vector-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json(
        { error: "Missing query parameter 'q'" },
        { status: 400 }
      );
    }
    if (query.length > 500) {
      return NextResponse.json(
        { error: "Query too long (max 500 chars)" },
        { status: 400 }
      );
    }

    const topK = Math.min(
      parseInt(searchParams.get("limit") ?? "5", 10),
      20
    );

    const embedding = await generateEmbedding(query);
    const results = await searchProjects(embedding, topK);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[RAG /api/rag/search]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
