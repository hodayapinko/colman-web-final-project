export const CHUNK_SIZE = 900; 
export const CHUNK_OVERLAP = 100; 
export const REINDEX_DELAY_MS = 3000;
export const REINDEX_RATELIMIT_MS = 10000;

export interface ChunkMatch {
  postId: string;
  chunkIndex: number;
  content: string;
  score: number;
}
