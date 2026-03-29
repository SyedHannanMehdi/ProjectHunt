/**
 * Compatibility wrapper for the ProjectHunt RAG vector store.
 *
 * Historically this file contained a separate in-memory implementation.
 * To avoid drift and confusion with `./vector-store` (used by API/chat),
 * we now delegate to the canonical implementation exported there.
 */

export * from "./vector-store";
