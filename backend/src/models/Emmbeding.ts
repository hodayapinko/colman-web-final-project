import mongoose, { Document, Schema } from "mongoose";

export interface IEmbedding extends Document {
  post: mongoose.Types.ObjectId;
  chunkIndex: number; // which chunk of the post (0, 1, 2…)
  content: string; // the text that was embedded
  embedding: number[]; // vector
  createdAt: Date;
  updatedAt: Date;
}

const embeddingSchema = new Schema<IEmbedding>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    chunkIndex: { type: Number, required: true, default: 0 },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

// Compound unique: one embedding per post-chunk pair
embeddingSchema.index({ post: 1, chunkIndex: 1 }, { unique: true });

export default mongoose.model<IEmbedding>("Embedding", embeddingSchema);