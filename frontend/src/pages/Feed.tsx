import { Box, Typography, Paper, Avatar, Fab, CircularProgress, Rating } from "@mui/material";
import { LanguageOutlined, StarOutlined, LocationOnOutlined, Add } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { postService, type Post, type PostUser } from "../services/postService";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""} ago`;
};

const getPostUser = (post: Post): PostUser | null =>
  post.user && typeof post.user === "object" ? (post.user as PostUser) : null;

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    postService.getAll().then(setPosts).finally(() => setLoading(false));
  }, []);

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
        {loading ? (
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
          posts.map((post) => {
            const postUser = getPostUser(post);
            const username = postUser?.username ?? "User";
            const avatarSrc = postUser?.profilePicture
              ? `http://localhost:3000/public/${postUser.profilePicture}`
              : undefined;

            return (
              <Paper
                key={post._id}
                elevation={0}
                onClick={() => navigate(`/post/${post._id}`)}
                sx={{
                  bgcolor: "#fff",
                  borderRadius: 4,
                  p: 2,
                  mb: "20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  cursor: "pointer",
                }}
              >
                {/* User row */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                  <Avatar
                    src={avatarSrc}
                    sx={{ width: 42, height: 42, mr: 1.5, bgcolor: "#6344F5", fontSize: "0.9rem" }}
                  >
                    {username[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1A1A2E", lineHeight: 1.2 }}>
                      {username}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#9E9EB0" }}>Traveler</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#9E9EB0" }}>
                    {timeAgo(post.createdAt)}
                  </Typography>
                </Box>

                {/* Hotel name */}
                <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#1A1A2E", mb: 0.5 }}>
                  {post.title}
                </Typography>

                {/* Location */}
                {post.location && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.75 }}>
                    <LocationOnOutlined sx={{ fontSize: 14, color: "#9E9EB0", mr: 0.25 }} />
                    <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0" }}>{post.location}</Typography>
                  </Box>
                )}

                {/* Rating */}
                {post.rating != null && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Rating
                      value={post.rating}
                      readOnly
                      precision={0.5}
                      sx={{
                        "& .MuiRating-iconFilled": { color: "#FFD700" },
                        "& .MuiRating-iconEmpty": { color: "#DDD" },
                        fontSize: "1.1rem",
                      }}
                    />
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>
                      {post.rating.toFixed(1)}/5
                    </Typography>
                  </Box>
                )}

                {/* Review snippet */}
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    color: "#444",
                    lineHeight: 1.6,
                    mb: post.image ? 1.5 : 0,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {post.content}
                </Typography>

                {/* Image */}
                {post.image && (
                  <Box
                    component="img"
                    src={post.image.startsWith("http") ? post.image : `http://localhost:3000/${post.image}`}
                    alt={post.title}
                    sx={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 2 }}
                  />
                )}
              </Paper>
            );
          })
        )}
      </Box>

      {/* FAB */}
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

