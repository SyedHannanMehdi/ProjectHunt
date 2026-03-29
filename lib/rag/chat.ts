import OpenAI from "openai";
import { generateEmbedding } from "./embeddings";
import { searchProjects } from "./vector-store";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface RagChatResult {
  answer: string;
  sources: {
    id: string;
    name: string;
    tagline: string | null;
    slug: string;
    logoUrl: string | null;
    score: number;
  }[];
}

/**
 * Run a RAG-powered chat turn over the ProjectHunt project corpus.
 *
 * 1. Embed the user's query.
 * 2. Retrieve the most relevant projects via cosine similarity.
 * 3. Build a context-enriched prompt and call GPT to generate an answer.
 */
export async function ragChat(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<RagChatResult> {
  // 1. Embed query
  const queryEmbedding = await generateEmbedding(userQuery);

  // 2. Retrieve top-5 relevant projects
  const results = await searchProjects(queryEmbedding, 5);

  // 3. Build context block
  const context =
    results.length > 0
      ? results
          .map(
            (r, i) =>
              `[${i + 1}] Name: ${r.name}\n` +
              (r.tagline ? `    Tagline: ${r.tagline}\n` : "") +
              (r.description
                ? `    Description: ${r.description.slice(0, 300)}\n`
                : "") +
              (r.tags.length ? `    Tags: ${r.tags.join(", ")}\n` : "") +
              (r.techStack.length
                ? `    Tech Stack: ${r.techStack.join(", ")}\n`
                : "") +
              (r.category ? `    Category: ${r.category}\n` : "")
          )
          .join("\n")
      : "No relevant projects found in the database.";

  // 4. Compose messages
  const systemPrompt = `You are an intelligent assistant for ProjectHunt, a platform where makers showcase their projects.
Your job is to help users discover projects, answer questions about them, and provide recommendations.
Use the retrieved project context below to answer the user's question accurately and helpfully.
If the context doesn't contain enough information, say so honestly.
Always be concise and friendly.

Retrieved Projects:
${context}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userQuery },
  ];

  // 5. Generate answer
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  const answer =
    completion.choices[0]?.message?.content ??
    "Sorry, I could not generate a response.";

  return {
    answer,
    sources: results.map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      slug: r.slug,
      logoUrl: r.logoUrl,
      score: r.score,
    })),
  };
}
