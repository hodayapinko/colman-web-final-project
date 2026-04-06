import { Box, Fab } from "@mui/material";
import { LanguageOutlined, Add } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../utils/authUtils";
import { postService, type IPost } from "../services/postService";
import { useCommentCounts } from "../utils/useCommentCounts";
import { useFeedEmptyState } from "../utils/emptyStateConfig";
import PageTopBar from "../components/PageTopBar";
import ReviewList from "../components/ReviewList";
import AppBottomNav from "../components/AppBottomNav";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const commentCounts = useCommentCounts(posts);
  const handleLogout = useLogout();
  const navigate = useNavigate();
  const feedEmptyState = useFeedEmptyState();

  useEffect(() => {
    postService
      .getAll()
      .then(setPosts)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        pb: "80px",
      }}
    >
      <PageTopBar
        icon={<LanguageOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="Global Feed"
        subtitle={`${posts.length} review${posts.length !== 1 ? "s" : ""}`}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        <ReviewList
          posts={posts}
          isLoading={isLoading}
          commentCounts={commentCounts}
          mode="feed"
          emptyState={feedEmptyState}
        />
      </Box>

      <Fab
        onClick={() => navigate("/create")}
        sx={{
          position: "fixed",
          bottom: 84,
          right: 20,
          bgcolor: "#6344F5",
          "&:hover": { bgcolor: "#512DC8" },
        }}
      >
        <Add sx={{ color: "#fff" }} />
      </Fab>

      <AppBottomNav activeIndex={1} />
    </Box>
  );
};

export default Feed;
