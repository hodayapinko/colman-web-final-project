import mongoose from "mongoose";
import { IPost } from "../constants/constants";
import Post from "../models/Post.model";
import Embedding from "../models/Emmbeding";
import {
  getGenAI,
  buildPostText,
  splitIntoChunks,
  cosineSimilarity,
  delay,
  REINDEX_DELAY,
  REINDEX_ERROR_DELAY,
} from "../utils/aiUtils";

// ── Embedding generation ────────────────────────────────────

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await getGenAI().models.embedContent({ model: "gemini-embedding-001", contents: text });
    return result.embeddings?.[0]?.values ?? [];
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = (err as { message?: string }).message ?? String(err);
    console.error(`[Embedding] generateEmbedding failed — status: ${status ?? "unknown"}, message: ${message}`);
    throw err;
  }
};

// ── Post embedding CRUD ─────────────────────────────────────

export const upsertPostEmbedding = async (
  post: IPost & { user?: { username?: string } | mongoose.Types.ObjectId }
): Promise<void> => {
  const text = buildPostText(post);
  const chunks = splitIntoChunks(text);

  const embeddings = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk)));

  const ops = chunks.map((content, i) => ({
    updateOne: {
      filter: { post: post._id, chunkIndex: i },
      update: { content, embedding: embeddings[i] },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await Embedding.bulkWrite(ops);
  }

  await Embedding.deleteMany({ post: post._id, chunkIndex: { $gte: chunks.length } });
};


export const deletePostEmbedding = async (
  postId: mongoose.Types.ObjectId | string
): Promise<void> => {
  await Embedding.deleteMany({ post: postId });
};

// ── Vector search ───────────────────────────────────────────

export interface ChunkMatch {
  postId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export const findSimilarChunks = async (
  queryText: string,
  limit = 5
): Promise<ChunkMatch[]> => {
  const queryEmbedding = await generateEmbedding(queryText);

  const allEmbeddings = await Embedding.find().lean();
  if (allEmbeddings.length === 0) return [];

  const scored: ChunkMatch[] = allEmbeddings.map((emb: { post: mongoose.Types.ObjectId; chunkIndex: number; content: string; embedding: number[] }) => ({
    postId: emb.post.toString(),
    chunkIndex: emb.chunkIndex,
    content: emb.content,
    score: cosineSimilarity(queryEmbedding, emb.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
};

// ── Backfill / Reindex ──────────────────────────────────────

export const reindexAllPosts = async (force = false): Promise<{ indexed: number; skipped: number; errors: number }> => {
  const posts = await Post.find().populate("user", "username").lean();

  let existingPostIds = new Set<string>();
  if (!force) {
    existingPostIds = new Set(
      (await Embedding.distinct("post")).map((id: mongoose.Types.ObjectId) => id.toString())
    );
  }

  let indexed = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of posts) {
    if (!force && existingPostIds.has(post._id.toString())) {
      skipped++;
      continue;
    }
    try {
      await upsertPostEmbedding(post as unknown as IPost & { user?: { username?: string } });
      indexed++;
      console.log(`[Embedding] Indexed post ${post._id} (${post.title})`);
      await delay(REINDEX_DELAY);
    } catch (err) {
      errors++;
      console.error(`[Embedding] Failed to index post ${post._id}:`, err);
      await delay(REINDEX_ERROR_DELAY);
    }
  }

  return { indexed, skipped, errors };
};
