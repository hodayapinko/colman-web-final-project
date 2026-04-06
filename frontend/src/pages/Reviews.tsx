import { Box } from "@mui/material";
import { HomeOutlined } from "@mui/icons-material";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../utils/authUtils";
import { useUserPosts } from "../utils/useUserPosts";
import { useCommentCounts } from "../utils/useCommentCounts";
import { useNoReviewsEmptyState } from "../utils/emptyStateConfig";
import PageTopBar from "../components/PageTopBar";
import ReviewList from "../components/ReviewList";
import AppBottomNav from "../components/AppBottomNav";

const Reviews: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const { posts, isLoading, deletePost } = useUserPosts(user?._id);
  const commentCounts = useCommentCounts(posts);
  const noReviewsEmptyState = useNoReviewsEmptyState(
    "Start your journey by sharing your first hotel experience. Your reviews help others make better travel decisions!"
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        pb: "70px",
      }}
    >
      <PageTopBar
        icon={<HomeOutlined sx={{ color: "#6344F5", fontSize: 20 }} />}
        iconBg="#EDE9FF"
        title="My Reviews"
        subtitle={`${posts.length} review${posts.length !== 1 ? "s" : ""}`}
        onLogout={handleLogout}
      />
      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        <ReviewList
          posts={posts}
          isLoading={isLoading}
          commentCounts={commentCounts}
          mode="mine"
          emptyState={noReviewsEmptyState}
          onEdit={(id) => navigate(`/edit/${id}`)}
          onDelete={deletePost}
        />
      </Box>
      <AppBottomNav activeIndex={0} />
    </Box>
  );
};

export default Reviews;
