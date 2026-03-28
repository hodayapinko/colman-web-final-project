import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, IconButton, TextField, Paper, CircularProgress,
} from "@mui/material";
import { ArrowBackOutlined, StarOutlined, SendOutlined, DeleteOutlined } from "@mui/icons-material";
import { postService, type IPost, type IPostUser } from "../services/postService";
import { commentService, type IComment } from "../services/commentService";
import { useAuth } from "../context/AuthContext";
import AppBottomNav from "../components/AppBottomNav";

const getPostUser = (post: IPost): IPostUser | null =>
  post.user && typeof post.user === "object" ? (post.user as IPostUser) : null;

const CommentsPage: React.FC = () => {
  const { postId: id } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<IPost | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([postService.getById(id), commentService.getByPost(id)])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentService.create({ postId: id, content: newComment, userId: user._id });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentService.delete(commentId);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F8F9FA" }}>
        <CircularProgress sx={{ color: "#6344F5" }} />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F8F9FA" }}>
        <Typography color="error">Review not found.</Typography>
      </Box>
    );
  }

  const postUser = getPostUser(post);
  const username = postUser?.username ?? "User";
  const avatarSrc = postUser?.profilePicture
    ? `http://localhost:3000/public/${postUser.profilePicture}`
    : undefined;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column", pb: user ? "120px" : "80px" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "#fff", px: 2, py: 1.5, display: "flex", alignItems: "center", borderBottom: "1px solid #F0F0F0" }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#1A1A2E" }}>
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A2E", flex: 1, textAlign: "center", mr: "40px", fontSize: "1rem" }}>
          Review & Comments
        </Typography>
      </Box>

      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        {/* Review Card */}
        <Paper elevation={0} sx={{ bgcolor: "#fff", borderRadius: 4, mb: 2.5, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {post.image && (
            <Box sx={{ position: "relative" }}>
              <Box
                component="img"
                src={post.image.startsWith("http") ? post.image : `http://localhost:3000/${post.image}`}
                alt={post.title}
                sx={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
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
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.25 }}>
              <Avatar src={avatarSrc} sx={{ width: 36, height: 36, mr: 1.25, bgcolor: "#6344F5", fontSize: "0.85rem" }}>
                {username[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1A1A2E", lineHeight: 1.2 }}>{username}</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "#9E9EB0" }}>{new Date(post.createdAt).toLocaleDateString()}</Typography>
              </Box>
              {post.rating != null && !post.image && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
                  <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>{post.rating} / 5</Typography>
                </Box>
              )}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1A1A2E", mb: 0.25 }}>{post.title}</Typography>
            {post.location && (
              <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0", mb: 0.75 }}>{post.location}</Typography>
            )}
            {post.content && (
              <Typography sx={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.7 }}>{post.content}</Typography>
            )}
          </Box>
        </Paper>

        {/* Comments Section */}
        <Typography sx={{ fontWeight: 700, color: "#1A1A2E", mb: 1.5, fontSize: "0.95rem" }}>
          Comments ({comments.length})
        </Typography>

        {comments.length === 0 && (
          <Typography sx={{ fontSize: "0.88rem", color: "#9E9EB0", textAlign: "center", py: 2 }}>
            No comments yet. Be the first!
          </Typography>
        )}

        {comments.map((comment) => (
          <Paper key={comment._id} elevation={0} sx={{ bgcolor: "#fff", borderRadius: 3, p: 1.75, mb: 1.25, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: "0.88rem", color: "#333", lineHeight: 1.6, flex: 1 }}>{comment.content}</Typography>
              {user && user._id === comment.userId && (
                <IconButton
                  size="small"
                  onClick={() => handleDeleteComment(comment._id)}
                  sx={{ color: "#d32f2f", ml: 1, p: 0.5 }}
                >
                  <DeleteOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
            <Typography sx={{ fontSize: "0.72rem", color: "#9E9EB0", mt: 0.5 }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Add Comment Input */}
      {user && (
        <Box
          component="form"
          onSubmit={handleAddComment}
          sx={{
            position: "fixed", bottom: 64, left: 0, right: 0,
            bgcolor: "#fff", borderTop: "1px solid #EBEBF0",
            px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, fontSize: "0.9rem" } }}
          />
          <IconButton
            type="submit"
            disabled={submitting || !newComment.trim()}
            sx={{ bgcolor: "#6344F5", color: "#fff", "&:hover": { bgcolor: "#512DC8" }, "&.Mui-disabled": { bgcolor: "#C7B9FF", color: "#fff" } }}
          >
            <SendOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      <AppBottomNav activeIndex={1} />
    </Box>
  );
};

export default CommentsPage;