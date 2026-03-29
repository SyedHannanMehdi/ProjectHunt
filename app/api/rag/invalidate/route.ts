import { NextResponse } from "next/server";
import { invalidateVectorCache } from "@/lib/rag/vector-store";

/**
 * POST /api/rag/invalidate
 * Clears the in-memory vector cache so new/updated projects are indexed
 * on the next search. Call this from your project creation/update webhooks.
 */
export async function POST() {
  try {
    invalidateVectorCache();
    return NextResponse.json({ success: true, message: "Vector cache invalidated." });
  } catch (err) {
    console.error("[RAG /api/rag/invalidate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
