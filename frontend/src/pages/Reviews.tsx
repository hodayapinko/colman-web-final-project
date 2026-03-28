import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { HomeOutlined, StarOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { postService, type IPost } from "../services/postService";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";

const Reviews: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    postService.getByUser(user._id).then(setPosts).finally(() => setIsLoading(false));
  }, [user]);

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
            <Paper
              key={post._id}
              elevation={0}
              sx={{ bgcolor: "#fff", borderRadius: 4, mb: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}
            >
              {/* Top image with rating badge */}
              {post.image && (
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="img"
                    src={post.image.startsWith("http") ? post.image : `http://localhost:3000/${post.image}`}
                    alt={post.title}
                    sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                  />
                  {post.rating != null && (
                    <Box sx={{
                      position: "absolute", top: 10, right: 10,
                      bgcolor: "#fff", borderRadius: 2, px: 1, py: 0.5,
                      display: "flex", alignItems: "center", gap: 0.5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}>
                      <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>{post.rating}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Body */}
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.25 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#1A1A2E" }}>{post.title}</Typography>
                  {post.rating != null && !post.image && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>{post.rating}</Typography>
                    </Box>
                  )}
                </Box>
                {post.location && (
                  <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0", mb: 0.75 }}>{post.location}</Typography>
                )}
                {post.content && (
                  <Typography sx={{
                    fontSize: "0.88rem", color: "#444", lineHeight: 1.6, mb: 1.5,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  }}>
                    {post.content}
                  </Typography>
                )}
                {/* Edit / Delete */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
                    bgcolor: "#F5F5F5", borderRadius: 2, py: 1, cursor: "pointer",
                    "&:hover": { bgcolor: "#EBEBF0" },
                  }}>
                    <EditOutlined sx={{ fontSize: 16, color: "#555" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#555" }}>Edit</Typography>
                  </Box>
                  <Box
                    onClick={() => handleDelete(post._id)}
                    sx={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
                      bgcolor: "#FFF0F0", borderRadius: 2, py: 1, cursor: "pointer",
                      "&:hover": { bgcolor: "#FFE0E0" },
                    }}
                  >
                    <DeleteOutlined sx={{ fontSize: 16, color: "#d32f2f" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#d32f2f" }}>Delete</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))
        )}
      </Box>
      <AppBottomNav activeIndex={0} />
    </Box>
  );
};

export default Reviews;
