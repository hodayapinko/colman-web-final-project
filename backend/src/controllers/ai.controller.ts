import { Response } from "express";
import Post from "../models/Post.model";
import { findSimilarChunks, reindexAllPosts } from "../services/embedding";
import { HTTP_STATUS } from "../constants/constants";
import {
  IAuthRequest,
  IGeminiJsonResponse,
  IPostSource,
  ISearchResponse,
} from "../utils/aiTypes";
import {
  buildAiPrompt,
  getCachedResponse,
  getGeminiClient,
  isWithinGlobalRateLimit,
  isWithinUserRateLimit,
  parseGeminiResponse,
  setCachedResponse,
  TOP_K_SIMILAR_CHUNKS,
} from "../utils/aiUtils";

// ── Main controller ─────────────────────────────────────────
export async function aiSearch(req: IAuthRequest, res: Response): Promise<void> {
  try {
    const query = (req.body.query ?? "").trim();
    if (!query) {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Search query is required." });
      return;
    }

    const cacheKey = query.toLowerCase();
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    if (!isWithinUserRateLimit(req.userId!)) {
      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json({ message: "Too many requests — please wait a moment." });
      return;
    }
    if (!isWithinGlobalRateLimit()) {
      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json({ message: "Server is at capacity — try again shortly." });
      return;
    }

    // Step 1 — vector search over hotel review chunks
    const similarChunks = await findSimilarChunks(query, TOP_K_SIMILAR_CHUNKS);
    if (similarChunks.length === 0) {
      console.warn(`[AI] No chunks found for: "${query}". Run /api/ai/reindex.`);
      res.json({ answer: "No relevant hotel reviews found.", sources: [] });
      return;
    }

    // Step 2 — fetch post metadata and drop orphaned chunks (deleted posts)
    const postIds = [...new Set(similarChunks.map((c) => c.postId))];
    const matchedPosts = await Post.find({ _id: { $in: postIds } })
      .select("title location rating")
      .lean();
    const postById = new Map(matchedPosts.map((p) => [p._id.toString(), p]));

    // Keep only chunks whose post still exists
    const validChunks = similarChunks.filter((c) => postById.has(c.postId));
    if (validChunks.length === 0) {
      res.json({ answer: "No relevant hotel reviews found.", sources: [] });
      return;
    }

    const contextBlocks = validChunks.map((chunk, i) => {
      const post = postById.get(chunk.postId)!;
      const label = `${post.location ?? "Unknown location"} (Rating: ${post.rating ?? "N/A"})`;
      return `[Source ${i + 1} — ${label}]\n${chunk.content}`;
    });

    // Step 3 — LLM generation
    const prompt = buildAiPrompt(contextBlocks.join("\n\n"), query);
    console.log(
      `[AI] Querying Gemini — query: "${query}", chunks: ${similarChunks.length}`
    );

    const client = await getGeminiClient();
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.2 },
    });

    const rawText = (result.text ?? "").trim();
    console.log(`[AI] Response preview: ${rawText.slice(0, 300)}`);

    let parsed: IGeminiJsonResponse;
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
      .filter((idx) => idx >= 1 && idx <= validChunks.length)
      .map((idx) => {
        const post = postById.get(validChunks[idx - 1].postId);
        if (!post) return null;
        return {
          postId: post._id.toString(),
          title: post.title,
          location: post.location,
          rating: post.rating,
        } as IPostSource;
      })
      .filter((s): s is IPostSource => {
        if (!s || seen.has(s.postId)) return false;
        seen.add(s.postId);
        return true;
      });

    const response: ISearchResponse = { answer: parsed.answer ?? "", sources };
    setCachedResponse(cacheKey, response);
    res.json(response);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = (err as { message?: string }).message ?? String(err);
    console.error(
      `[AI] Error — status: ${status ?? "unknown"}, message: ${message}`
    );

    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json({ message: "AI service is busy — please retry in a few seconds." });
      return;
    }
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "AI search failed. Please try again." });
  }
}

// ── Reindex controller ──────────────────────────────────────
export async function reindexPosts(
  req: IAuthRequest,
  res: Response
): Promise<void> {
  try {
    const force = req.query.force === "true";
    const result = await reindexAllPosts(force);
    res.json(result);
  } catch (err) {
    console.error("[AI] Reindex error:", err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ message: "Reindex posts failed." });
  }
}
