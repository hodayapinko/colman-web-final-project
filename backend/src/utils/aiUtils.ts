// Shared AI helpers for controllers (rate limiting, caching, prompt building, Gemini client)

import { IGeminiJsonResponse } from "./aiTypes";

// ── Gemini client (lazy singleton) ─────────────────────────
// Note: @google/genai is ESM-only; we load it via dynamic import to work in a CommonJS backend.
let geminiClient: unknown | null = null;

export async function getGeminiClient(): Promise<any> {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY ?? "";
    if (!key) throw new Error("GEMINI_API_KEY is not set");

    const mod = await import("@google/genai");
    const GoogleGenAI = (mod as any).GoogleGenAI;

    console.log(
      `[AI] Initializing Gemini client — key: ${key.slice(0, 8)}...${key.slice(-4)}`
    );

    geminiClient = new GoogleGenAI({ apiKey: key });
  }

  return geminiClient as any;
}

// ── Constants ───────────────────────────────────────────────
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const USER_REQUESTS_PER_WINDOW = 5;
export const GLOBAL_REQUESTS_PER_WINDOW = 10;
export const CACHE_TTL_MS = 5 * 60_000;
export const TOP_K_SIMILAR_CHUNKS = 5;

// ── Rate limiting ───────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const userRequestCountByUserId = new Map<string, RateLimitEntry>();
let globalRequestCountInWindow = 0;
let globalRateLimitWindowResetAtMs = Date.now();

export function isWithinUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRequestCountByUserId.get(userId);

  if (!entry || now > entry.resetAt) {
    userRequestCountByUserId.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= USER_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

export function isWithinGlobalRateLimit(): boolean {
  const now = Date.now();

  if (now > globalRateLimitWindowResetAtMs) {
    globalRequestCountInWindow = 0;
    globalRateLimitWindowResetAtMs = now + RATE_LIMIT_WINDOW_MS;
  }

  if (globalRequestCountInWindow >= GLOBAL_REQUESTS_PER_WINDOW) return false;
  globalRequestCountInWindow++;
  return true;
}

// ── Response cache ──────────────────────────────────────────
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const responseCacheByQuery = new Map<string, CacheEntry>();

export function getCachedResponse(key: string): unknown | null {
  const entry = responseCacheByQuery.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

export function setCachedResponse(key: string, data: unknown): void {
  responseCacheByQuery.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function clearResponseCache(): void {
  responseCacheByQuery.clear();
}

// ── Prompt builder ──────────────────────────────────────────
export function buildAiPrompt(context: string, query: string): string {
  return `You are a hotel review assistant. Your job is to help users based on the review data.

Answer the user's question using ONLY the context below.
- If asked for the best hotels, prefer higher rating when relevant.
- If the context lacks sufficient information, say so honestly.
- Be concise and match the language of the user's question.

--- CONTEXT ---
${context}
--- END CONTEXT ---

User question: "${query}"

Reply with JSON only (no markdown fences):
{
  "answer": "<your helpful answer based on the context>",
  "sources": [<1-based indexes of the sources you used, e.g. 1, 2>]
}`;
}

// ── Parse Gemini response ───────────────────────────────────
export function parseGeminiResponse(raw: string): IGeminiJsonResponse {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as IGeminiJsonResponse;
}
