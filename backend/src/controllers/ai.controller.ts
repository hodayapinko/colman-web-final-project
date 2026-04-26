import { Request, Response } from "express";
import { findRelevantChunks, reindexAllPostEmbeddings } from "../services/embedding";
import Post from "../models/Post.model";
import { HTTP_STATUS } from "../constants/constants";
import {
  getGeminiClient,
  isWithinUserRateLimit,
  isWithinGlobalRateLimit,
  getCachedSearchResponse,
  cacheSearchResponse,
} from "../utils/aiUtils";

interface AuthRequest extends Request {
  userId?: string;
}

const TOP_K_CHUNKS = 5;

export const handleAiSearch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Search query is required." });
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    // ── Cache check ───────────────────────────────────────
    const cached = getCachedSearchResponse(trimmedQuery);
    if (cached) {
      res.json(cached);
      return;
    }

    // ── Rate limits ───────────────────────────────────────
    if (!isWithinUserRateLimit(req.userId!)) {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({ message: "Too many AI requests. Please wait a moment." });
      return;
    }
    if (!isWithinGlobalRateLimit()) {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({ message: "Server is reaching capacity. Try again in a minute." });
      return;
    }


    // ── RAG Step 1: Query Embedding + Vector Search ───────
    const topChunks = await findRelevantChunks(query.trim(), TOP_K_CHUNKS);

    if (topChunks.length === 0) {
      console.warn(`[AI] No embeddings found for query: "${query.trim()}" — Embedding collection may be empty. Run /api/ai/reindex.`);
      res.json({ answer: "No data available to search.", sources: [] });
      return;
    }

    // ── RAG Step 2: Fetch source post metadata ────────────
    const uniquePostIds = [...new Set(topChunks.map((c) => c.postId))];
    const posts = await Post.find({ _id: { $in: uniquePostIds } })
      .populate("user", "username")
      .lean();
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));

    const contextParts = topChunks.map((chunk, i) => {
      const post = postMap.get(chunk.postId);
      const label = post ? `${post.title}${post.location ? ` @ ${post.location}` : ""}` : "Unknown Post";
      return `[Source ${i + 1} — "${label}"]\n${chunk.content}`;
    });
    const context = contextParts.join("\n\n");

    // ── RAG Step 3: Prompt Augmentation + LLM Generation ──
    console.log(`[AI] RAG search — query: "${query.trim()}", chunks: ${topChunks.length}`);

    const prompt = `You are a helpful assistant for a hotel review platform. Answer the user's question based ONLY on the context below.
The context contains post reviews with fields: username, title, content, rating, and location.
If the context does not contain enough information, say so honestly.
Be concise and helpful. Use the same language as the user's question.

--- CONTEXT ---
${context}
--- END CONTEXT ---

User question: "${query.trim()}"

Respond in JSON only (no markdown fences):
{
  "answer": "<your helpful answer based on the context>",
  "sources": [<indexes of the sources you used, e.g. 1, 2>]
}`;

    const result = await getGeminiClient().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { temperature: 0.2 } });
    console.log(`[AI] generateContent succeeded`);
    const responseText = (result.text ?? "").trim();
    console.log(`[AI] Raw Gemini response: ${responseText.slice(0, 300)}`);

    let parsed: { answer: string; sources: number[] };
    try {
      const cleanJson = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.error(`[AI] Failed to parse Gemini JSON response. Raw text: ${responseText}`);
      res.json({ answer: "Could not process search. Please try a different query.", sources: [] });
      return;
    }

    // Map source indexes back to post data
    const sources = (parsed.sources || [])
      .filter((idx: number) => idx >= 1 && idx <= topChunks.length)
      .map((idx: number) => {
        const chunk = topChunks[idx - 1];
        const post = postMap.get(chunk.postId);
        return post
          ? {
              postId: post._id.toString(),
              title: post.title,
              location: post.location,
              rating: post.rating,
            }
          : null;
      })
      .filter(Boolean);

    // Deduplicate sources by postId
    const seenPosts = new Set<string>();
    const uniqueSources = sources.filter((s: { postId: string } | null) => {
      if (!s || seenPosts.has(s.postId)) return false;
      seenPosts.add(s.postId);
      return true;
    });

    const responseData = {
      answer: parsed.answer || "",
      sources: uniqueSources,
    };

    cacheSearchResponse(trimmedQuery, responseData);
    res.json(responseData);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const errMsg = (err as { message?: string }).message ?? String(err);
    console.error(`[AI] Search error — status: ${status ?? "unknown"}, message: ${errMsg}`);
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({ message: "AI is busy right now. Please wait a few seconds and try again." });
      return;
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "AI search failed. Please try again." });
  }
};

// ── Reindex all posts ───────────────────────────────────────

export const handleReindexPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const force = req.query?.force === "true";
    const result = await reindexAllPostEmbeddings(force);
    res.json(result);
  } catch (err) {
    console.error("Reindex error:", err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: "Reindex failed." });
  }
};
