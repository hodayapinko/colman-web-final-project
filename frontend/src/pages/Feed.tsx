import { Box, Typography, Paper, Avatar, Fab, CircularProgress } from "@mui/material";
import { LanguageOutlined, StarOutlined, Add, ChatBubbleOutline } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { postService, type IPost, type IPostUser } from "../services/postService";
import { commentService } from "../services/commentService";
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

const getPostUser = (post: IPost): IPostUser | null =>
  post.user && typeof post.user === "object" ? (post.user as IPostUser) : null;

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    postService.getAll().then(setPosts).finally(() => setLoading(false));
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
            const count = commentCounts[post._id] ?? 0;

            return (
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
                  {/* User row */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.25 }}>
                    <Avatar
                      src={avatarSrc}
                      sx={{ width: 36, height: 36, mr: 1.25, bgcolor: "#6344F5", fontSize: "0.85rem" }}
                    >
                      {username[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1A1A2E", lineHeight: 1.2 }}>
                        {username}
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "#9E9EB0" }}>{timeAgo(post.createdAt)}</Typography>
                    </Box>
                    {post.rating != null && !post.image && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>{post.rating}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#1A1A2E", mb: 0.25 }}>{post.title}</Typography>
                  {post.location && (
                    <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0", mb: 0.75 }}>{post.location}</Typography>
                  )}
                  {post.content && (
                    <Typography sx={{
                      fontSize: "0.88rem", color: "#444", lineHeight: 1.6, mb: 1.25,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                    }}>
                      {post.content}
                    </Typography>
                  )}

                  {/* Comment button */}
                  <Box
                    onClick={() => navigate(`/comments/${post._id}`)}
                    sx={{
                      display: "inline-flex", alignItems: "center", gap: 0.75,
                      bgcolor: "#F4F1FF", borderRadius: 2, px: 1.5, py: 0.75,
                      cursor: "pointer", "&:hover": { bgcolor: "#EDE9FF" },
                    }}
                  >
                    <ChatBubbleOutline sx={{ fontSize: 16, color: "#6344F5" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#6344F5" }}>
                      {count} {count === 1 ? "Comment" : "Comments"}
                    </Typography>
                  </Box>
                </Box>
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