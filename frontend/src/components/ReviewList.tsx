import React from "react";
import { Box, CircularProgress } from "@mui/material";
import type { IPost } from "../services/postService";
import ReviewCard from "./ReviewCard";
import EmptyStateView from "./EmptyStateView";

interface IReviewListProps {
  posts: IPost[];
  isLoading: boolean;
  commentCounts: Record<string, number>;
  mode?: "mine" | "feed";
  emptyState: {
    illustration: React.ReactNode;
    heading: string;
    description: string;
    ctaLabel: string;
    onCtaClick: () => void;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ReviewList: React.FC<IReviewListProps> = ({
  posts,
  isLoading,
  commentCounts,
  mode = "mine",
  emptyState,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: "#6344F5" }} />
      </Box>
    );
  }

  if (posts.length === 0) {
    return <EmptyStateView {...emptyState} />;
  }

  return (
    <>
      {posts.map((post) => (
        <ReviewCard
          key={post._id}
          post={post}
          mode={mode}
          commentCount={commentCounts[post._id] ?? 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default ReviewList;
