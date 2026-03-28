import { Box, Fab, CircularProgress } from "@mui/material";
import { LanguageOutlined, StarOutlined, Add } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { postService, type IPost } from "../services/postService";
import { commentService } from "../services/commentService";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";
import FeedPostCard from "../components/FeedPostCard";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    postService.getAll().then(setPosts).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    Promise.all(
      posts.map((p) =>
        commentService.getByPost(p._id)
          .then((c) => ({ id: p._id, count: c.length }))
          .catch(() => ({ id: p._id, count: 0 }))
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach(({ id, count }) => { counts[id] = count; });
      setCommentCounts(counts);
    });
  }, [posts]);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login"); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column", pb: "80px" }}>
      <PageTopBar
        icon={<LanguageOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="Global Feed"
        subtitle={`${posts.length} review${posts.length !== 1 ? "s" : ""}`}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#6344F5" }} />
          </Box>
        ) : posts.length === 0 ? (
          <EmptyStateView
            illustration={
              <Box sx={{ position: "relative", width: 160, height: 160 }}>
                <Box sx={{ width: 160, height: 160, borderRadius: "50%", bgcolor: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LanguageOutlined sx={{ fontSize: 72, color: "#6344F5" }} />
                </Box>
                <Box sx={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", bgcolor: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(245,166,35,0.5)" }}>
                  <StarOutlined sx={{ fontSize: 16, color: "#fff" }} />
                </Box>
              </Box>
            }
            heading="No Reviews in Feed"
            description="The community feed is empty. Be the first to share a hotel review and inspire other travelers!"
            ctaLabel="Share First Review"
            onCtaClick={() => navigate("/create")}
          />
        ) : (
          posts.map((post) => (
            <FeedPostCard
              key={post._id}
              post={post}
              commentCount={commentCounts[post._id] ?? 0}
            />
          ))
        )}
      </Box>

      <Fab
        onClick={() => navigate("/create")}
        sx={{ position: "fixed", bottom: 84, right: 20, bgcolor: "#6344F5", "&:hover": { bgcolor: "#512DC8" } }}
      >
        <Add sx={{ color: "#fff" }} />
      </Fab>

      <AppBottomNav activeIndex={1} />
    </Box>
  );
};

export default Feed;