import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import Hotel from "../models/Hotel.model";
import { findSimilarChunks, reindexAllHotels } from "../services/embedding";

// ── Auth request type (matches authMiddleware) ─────────────
interface AuthRequest extends Request {
  userId?: string;
}

// ── Gemini client (lazy singleton) ─────────────────────────
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY ?? "";
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    console.log(
      `[AI] Initializing Gemini client — key: ${key.slice(0, 8)}...${key.slice(-4)}`
    );
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
}

// ── Types ───────────────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

interface HotelSource {
  hotelId: string;
  name: string;
  location: string;
  rating?: number;
  priceRange?: string;
}

interface SearchResponse {
  answer: string;
  sources: HotelSource[];
}

// ── Constants ───────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;
const USER_RATE_LIMIT = 5;
const GLOBAL_RATE_LIMIT = 10;
const CACHE_TTL_MS = 5 * 60_000;
const TOP_K_CHUNKS = 5;

// ── Rate limiting ───────────────────────────────────────────
const userLimits = new Map<string, RateLimitEntry>();
let globalCount = 0;
let globalResetAt = Date.now();

function withinUserLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    userLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= USER_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function withinGlobalLimit(): boolean {
  const now = Date.now();
  if (now > globalResetAt) {
    globalCount = 0;
    globalResetAt = now + RATE_WINDOW_MS;
  }
  if (globalCount >= GLOBAL_RATE_LIMIT) return false;
  globalCount++;
  return true;
}

// ── Response cache ──────────────────────────────────────────
const cache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCached(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── Prompt builder ──────────────────────────────────────────
function buildPrompt(context: string, query: string): string {
  return `You are a hotel recommendation assistant. Your job is to help users find the best hotels based on reviews, ratings, price range, location, and amenities.

Answer the user's question using ONLY the context provided below.
- If asked about location, highlight proximity to landmarks or city centers.
- If asked about price, mention value-for-money based on the reviews.
- If asked about amenities (pool, spa, gym, breakfast, etc.), extract that from the reviews.
- If asked for the best hotels, rank by rating if available.
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
function parseGeminiResponse(raw: string): { answer: string; sources: number[] } {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Main controller ─────────────────────────────────────────
export async function aiSearch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const query = (req.body.query ?? "").trim();
    if (!query) {
      res.status(400).json({ message: "Search query is required." });
      return;
    }

    const cacheKey = query.toLowerCase();
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    if (!withinUserLimit(req.userId!)) {
      res
        .status(429)
        .json({ message: "Too many requests — please wait a moment." });
      return;
    }
    if (!withinGlobalLimit()) {
      res
        .status(429)
        .json({ message: "Server is at capacity — try again shortly." });
      return;
    }

    // Step 1 — vector search over hotel review chunks
    const chunks = await findSimilarChunks(query, TOP_K_CHUNKS);
    if (chunks.length === 0) {
      console.warn(`[AI] No chunks found for: "${query}". Run /api/ai/reindex.`);
      res.json({ answer: "No relevant hotel reviews found.", sources: [] });
      return;
    }

    // Step 2 — fetch hotel metadata
    const hotelIds = [...new Set(chunks.map((c) => c.hotelId))];
    const hotels = await Hotel.find({ _id: { $in: hotelIds } })
      .populate("owner", "username profileImage")
      .lean();
    const hotelMap = new Map(hotels.map((h) => [h._id.toString(), h]));

    const contextBlocks = chunks.map((chunk, i) => {
      const hotel = hotelMap.get(chunk.hotelId);
      const label = hotel
        ? `${hotel.name} — ${hotel.location} (Rating: ${hotel.rating ?? "N/A"}, Price: ${hotel.priceRange ?? "N/A"})`
        : "Unknown Hotel";
      return `[Source ${i + 1} — ${label}]\n${chunk.content}`;
    });

    // Step 3 — LLM generation
    const prompt = buildPrompt(contextBlocks.join("\n\n"), query);
    console.log(
      `[AI] Querying Gemini — query: "${query}", chunks: ${chunks.length}`
    );

    const result = await getGenAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.2 },
    });

    const rawText = (result.text ?? "").trim();
    console.log(`[AI] Response preview: ${rawText.slice(0, 300)}`);

    let parsed: { answer: string; sources: number[] };
    try {
      parsed = parseGeminiResponse(rawText);
    } catch {
      console.error(`[AI] JSON parse failed. Raw: ${rawText}`);
      res.json({
        answer: "Could not process the response. Try a different query.",
        sources: [],
      });
      return;
    }

    // Step 4 — map source indexes back to hotel data
    const seen = new Set<string>();
    const sources = (parsed.sources ?? [])
      .filter((idx) => idx >= 1 && idx <= chunks.length)
      .map((idx) => {
        const hotel = hotelMap.get(chunks[idx - 1].hotelId);
        return hotel
          ? {
              hotelId: hotel._id.toString(),
              name: hotel.name,
              location: hotel.location,
              rating: hotel.rating,
              priceRange: hotel.priceRange,
            }
          : null;
      })
      .filter((s): s is HotelSource => {
        if (!s || seen.has(s.hotelId)) return false;
        seen.add(s.hotelId);
        return true;
      });

    const response: SearchResponse = { answer: parsed.answer ?? "", sources };
    setCached(cacheKey, response);
    res.json(response);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = (err as { message?: string }).message ?? String(err);
    console.error(
      `[AI] Error — status: ${status ?? "unknown"}, message: ${message}`
    );

    if (status === 429) {
      res
        .status(429)
        .json({ message: "AI service is busy — please retry in a few seconds." });
      return;
    }
    res.status(500).json({ message: "AI search failed. Please try again." });
  }
}

// ── Reindex controller ──────────────────────────────────────
export async function reindex(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const result = await reindexAllHotels();
    res.json(result);
  } catch (err) {
    console.error("[AI] Reindex error:", err);
    res.status(500).json({ message: "Reindex failed." });
  }
}
