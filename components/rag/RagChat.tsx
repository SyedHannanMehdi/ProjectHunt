"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Send, Bot, User, Loader2, ExternalLink, Sparkles } from "lucide-react";

interface Source {
  id: string;
  name: string;
  tagline: string | null;
  slug: string;
  logoUrl: string | null;
  score: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function RagChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the ProjectHunt AI assistant 🚀. Ask me anything about the projects here — I can help you discover tools, recommend tech stacks, or explain what a project does.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    const userMessage: Message = { role: "user", content: query };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages
        .slice(0, -1) // exclude the message we just added
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[680px] rounded-2xl border border-border bg-background shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">ProjectHunt AI</p>
          <p className="text-xs text-muted-foreground">
            Powered by RAG &amp; GPT-4o mini
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={`flex flex-col gap-2 max-w-[80%] ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="w-full space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium px-1">
                    Relevant projects:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {msg.sources.map((src) => (
                      <Link
                        key={src.id}
                        href={`/projects/${src.slug}`}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2 hover:bg-muted/50 transition-colors group"
                      >
                        {src.logoUrl ? (
                          <Image
                            src={src.logoUrl}
                            alt={src.name}
                            width={28}
                            height={28}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {src.name[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {src.name}
                          </p>
                          {src.tagline && (
                            <p className="text-xs text-muted-foreground truncate">
                              {src.tagline}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about projects…"
          disabled={loading}
          className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
