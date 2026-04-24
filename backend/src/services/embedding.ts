import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

// ── Gemini client (lazy singleton) ─────────────────────────

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY ?? "";
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
}

// ── Constants ───────────────────────────────────────────────

const CHUNK_SIZE    = 900;  // ~800–1000 characters per chunk
const CHUNK_OVERLAP = 100;  // overlap to preserve context at boundaries
const REINDEX_DELAY_MS      = 3_000;
const REINDEX_RATELIMIT_MS  = 10_000;

// ── Types ───────────────────────────────────────────────────

export interface ChunkMatch {
  hotelId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

// ── Text preparation ────────────────────────────────────────

/**
 * Build a single searchable string from a hotel's fields.
 * Includes name, location, rating, price range, amenities, and review text.
 */
export function buildHotelText(hotel: {
  name: string;
  location: string;
  rating?: number;
  priceRange?: string;
  amenities?: string[];
  description?: string;
  owner?: { username?: string } | mongoose.Types.ObjectId | string;
}): string {
  const author =
    typeof hotel.owner === "object" &&
    hotel.owner !== null &&
    "username" in hotel.owner
      ? (hotel.owner as { username?: string }).username
      : undefined;

  const parts = [
    `Hotel: ${hotel.name}`,
    `Location: ${hotel.location}`,
    hotel.rating     != null ? `Rating: ${hotel.rating} / 5`      : "",
    hotel.priceRange          ? `Price range: ${hotel.priceRange}` : "",
    hotel.amenities?.length   ? `Amenities: ${hotel.amenities.join(", ")}` : "",
    hotel.description         ? `Review: ${hotel.description}`     : "",
    author                    ? `Reviewer: ${author}`              : "",
  ];

  return parts.filter(Boolean).join(". ");
}

/**
 * Split text into overlapping chunks of ~CHUNK_SIZE characters,
 * preferring sentence boundaries to avoid cutting mid-sentence.
 */
export function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const lookback     = Math.floor(CHUNK_SIZE * 0.2);
      const searchStart  = end - lookback;
      const segment      = text.slice(searchStart, end);
      const sentenceEnd  = segment.search(/[.!?]\s/);
      if (sentenceEnd !== -1) end = searchStart + sentenceEnd + 1;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }

  return chunks.filter((c) => c.length > 0);
}

// ── Embedding generation ────────────────────────────────────

/**
 * Call the Gemini embedding API for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await getGenAI().models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    return result.embeddings?.[0]?.values ?? [];
  } catch (err: unknown) {
    const status  = (err as { status?: number }).status;
    const message = (err as { message?: string }).message ?? String(err);
    console.error(`[Embedding] generateEmbedding failed — status: ${status ?? "unknown"}, message: ${message}`);
    throw err;
  }
}

// ── Hotel embedding CRUD ────────────────────────────────────

/**
 * Create or update all chunk embeddings for a hotel review.
 * Stale chunks from a previous version are removed automatically.
 */
export async function upsertHotelEmbedding(
  hotel: IHotel & { owner?: { username?: string } | mongoose.Types.ObjectId }
): Promise<void> {
  const text   = buildHotelText(hotel);
  const chunks = splitIntoChunks(text);

  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk))
  );

  const ops = chunks.map((content, i) => ({
    updateOne: {
      filter: { hotel: hotel._id, chunkIndex: i },
      update: { content, embedding: embeddings[i] },
      upsert: true,
    },
  }));

  if (ops.length > 0) await Embedding.bulkWrite(ops);

  // Remove stale chunks if this hotel previously had more
  await Embedding.deleteMany({ hotel: hotel._id, chunkIndex: { $gte: chunks.length } });
}

/**
 * Delete all embeddings associated with a hotel.
 */
export async function deleteHotelEmbedding(
  hotelId: mongoose.Types.ObjectId | string
): Promise<void> {
  await Embedding.deleteMany({ hotel: hotelId });
}

// ── Vector search ───────────────────────────────────────────

/**
 * Cosine similarity between two equal-length vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Find the top-K chunks most similar to a query string.
 * Returns results sorted by descending cosine similarity score.
 */
export async function findSimilarChunks(
  queryText: string,
  limit = 5
): Promise<ChunkMatch[]> {
  const queryEmbedding = await generateEmbedding(queryText);
  const allEmbeddings  = await Embedding.find().lean();

  if (allEmbeddings.length === 0) return [];

  return allEmbeddings
    .map((emb) => ({
      hotelId:    emb.hotel.toString(),
      chunkIndex: emb.chunkIndex,
      content:    emb.content,
      score:      cosineSimilarity(queryEmbedding, emb.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ── Reindex ─────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Index all hotels that don't yet have embeddings.
 * Processes sequentially with delays to respect API rate limits.
 */
export async function reindexAllHotels(): Promise<{
  indexed: number;
  skipped: number;
  errors: number;
}> {
  const hotels = await Hotel.find()
    .populate("owner", "username profileImage")
    .lean();

  const indexedIds = new Set(
    (await Embedding.distinct("hotel")).map((id: mongoose.Types.ObjectId) =>
      id.toString()
    )
  );

  let indexed = 0, skipped = 0, errors = 0;

  for (const hotel of hotels) {
    if (indexedIds.has(hotel._id.toString())) {
      skipped++;
      continue;
    }
    try {
      await upsertHotelEmbedding(
        hotel as unknown as IHotel & { owner?: { username?: string } }
      );
      indexed++;
      console.log(`[Embedding] Indexed hotel ${hotel._id} — ${hotel.name} (${hotel.location})`);
      await delay(REINDEX_DELAY_MS);
    } catch (err) {
      errors++;
      console.error(`[Embedding] Failed to index hotel ${hotel._id}:`, err);
      await delay(REINDEX_RATELIMIT_MS);
    }
  }

  return { indexed, skipped, errors };
}