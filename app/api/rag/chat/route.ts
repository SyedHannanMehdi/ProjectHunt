import { NextRequest, NextResponse } from "next/server";
import { ragChat, ChatMessage } from "@/lib/rag/chat";
import { z } from "zod";

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { query, history } = parsed.data;
    const result = await ragChat(query, history as ChatMessage[]);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[RAG /api/rag/chat]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
