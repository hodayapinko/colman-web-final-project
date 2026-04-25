import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

export const REINDEX_DELAY = 3000;
export const REINDEX_ERROR_DELAY = 10000;

// ── Gemini client singleton ─────────────────────────────────

export const getGenAI = (): GoogleGenAI => {  
  let genAI: GoogleGenAI | null = null;
  let currentKey = "";
  const key = process.env.GEMINI_API_KEY || "";

  if (!genAI || key !== currentKey) {
    console.log("[AI] Using GEMINI_API_KEY:", key ? `${key.slice(0, 8)}...${key.slice(-4)}` : "MISSING");
    genAI = new GoogleGenAI({ apiKey: key });
    currentKey = key;
  }
  return genAI;
};

// ── Rate limiting ───────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

let globalRequestCount = 0;
let globalRateLimitReset = Date.now();
const GLOBAL_RATE_LIMIT = 10;

export const checkGlobalLimit = (): boolean => {
  const now = Date.now();
  if (now - globalRateLimitReset > RATE_WINDOW) {
    globalRequestCount = 0;
    globalRateLimitReset = now;
  }
  if (globalRequestCount >= GLOBAL_RATE_LIMIT) return false;
  globalRequestCount++;
  return true;
};

export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
};


// ── Cache ───────────────────────────────────────────────────

const searchCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export const getCachedResult = (key: string): unknown | null => {
  const cached = searchCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  return null;
};

export const setCachedResult = (key: string, data: unknown): void => {
  searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
};

export const clearSearchCache = (): void => {
  searchCache.clear();
};

// ── Text preparation ────────────────────────────────────────

export const buildPostText = (post: {
  title: string;
  content: string;
  location?: string;
  rating?: number;
  user?: { username?: string } | mongoose.Types.ObjectId | string;
}): string => {
  const author =
    typeof post.user === "object" && post.user !== null && "username" in post.user
      ? (post.user as { username?: string }).username
      : undefined;
  const parts = [
    post.title ? `Title: ${post.title}` : "",
    post.content ? `Content: ${post.content}` : "",
    post.location ? `Location: ${post.location}` : "",
    post.rating != null ? `Rating: ${post.rating}` : "",
    author ? `Author: ${author}` : "",
  ];
  return parts.filter(Boolean).join(". ");
};

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 100;

export const splitIntoChunks = (text: string): string[] => {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const lookback = Math.floor(CHUNK_SIZE * 0.2);
      const searchStart = end - lookback;
      const segment = text.slice(searchStart, end);
      const sentenceEnd = segment.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        end = searchStart + sentenceEnd + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }

  return chunks.filter((c: string) => c.length > 0);
};

// ── Vector math ─────────────────────────────────────────────

export const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// ── Helpers ─────────────────────────────────────────────────

export const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ── Retry with backoff ──────────────────────────────────────

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 2000;

export const withRetry = async <T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const wait = INITIAL_BACKOFF * Math.pow(2, attempt);
        console.warn(`[${label}] Rate limited (429), retrying in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await delay(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`[${label}] Max retries exceeded`);
};
