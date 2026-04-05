import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, TextField, CircularProgress } from "@mui/material";
import { SendOutlined } from "@mui/icons-material";
import { postService, type IPost } from "../services/postService";
import { commentService, type IComment } from "../services/commentService";
import { useAuth } from "../context/AuthContext";
import PageTopBar from "../components/PageTopBar";
import ReviewCard from "../components/ReviewCard";
import CommentItem from "../components/CommentItem";
import AppBottomNav from "../components/AppBottomNav";

const CommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<IPost | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  useEffect(() => {
    if (!postId) return;
    Promise.all([postService.getById(postId), commentService.getByPost(postId)])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      })
      .finally(() => setIsLoading(false));
  }, [postId]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !postId || !newComment.trim()) return;
    setSubmitting(true);
    setCommentError("");
    try {
      const res = await commentService.create({ postId, content: newComment, userId: user._id });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err: any) {
      setCommentError(err?.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentService.delete(commentId);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (isLoading) {
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column", pb: user ? "120px" : "80px" }}>
      <PageTopBar
        title="Review & Comments"
        subtitle={`${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
        onBack={() => navigate(-1)}
      />

      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        <ReviewCard post={post} />

        <Typography sx={{ fontWeight: 700, color: "#1A1A2E", mb: 1.5, fontSize: "0.95rem" }}>
          Comments ({comments.length})
        </Typography>

        {comments.length === 0 && (
          <Typography sx={{ fontSize: "0.88rem", color: "#9E9EB0", textAlign: "center", py: 2 }}>
            No comments yet. Be the first!
          </Typography>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUserId={user?._id}
            onDelete={handleDeleteComment}
          />
        ))}
      </Box>

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
            error={!!commentError}
            helperText={commentError || undefined}
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