import { Box, CircularProgress } from "@mui/material";
import { HomeOutlined, StarOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { postService, type IPost } from "../services/postService";
import { commentService } from "../services/commentService";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";
import ReviewCard from "../components/ReviewCard";

const Reviews: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    postService.getByUser(user._id).then(setPosts).finally(() => setIsLoading(false));
  }, [user]);

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

  const handleDelete = async (id: string) => {
    await postService.delete(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login"); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column", pb: "70px" }}>
      <PageTopBar
        icon={<HomeOutlined sx={{ color: "#6344F5", fontSize: 20 }} />}
        iconBg="#EDE9FF"
        title="My Reviews"
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
              <Box sx={{ width: 160, height: 160, borderRadius: "50%", bgcolor: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StarOutlined sx={{ fontSize: 72, color: "#6344F5" }} />
              </Box>
            }
            heading="No Reviews Yet"
            description="Start your journey by sharing your first hotel experience. Your reviews help others make better travel decisions!"
            ctaLabel="Add Your First Review"
            onCtaClick={() => navigate("/create")}
          />
        ) : (
          posts.map((post) => (
            <ReviewCard
              key={post._id}
              post={post}
              mode="mine"
              commentCount={commentCounts[post._id] ?? 0}
              onEdit={(id) => navigate(`/edit/${id}`)}
              onDelete={handleDelete}
            />
          ))
        )}
      </Box>
      <AppBottomNav activeIndex={0} />
    </Box>
  );
};

export default Reviews;