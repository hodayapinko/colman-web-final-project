import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { StarOutlined, ChatBubbleOutline, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { type IPost } from "../services/postService";
import { getPostUser, timeAgo, resolveImageUrl } from "../utils/postUtils";

interface ReviewCardProps {
  post: IPost;
  mode?: "feed" | "detail" | "mine";
  commentCount?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ post, mode = "detail", commentCount, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const postUser = getPostUser(post);
  const username = postUser?.username ?? "User";
  const avatarSrc = postUser?.profilePicture
    ? `http://localhost:3000/public/${postUser.profilePicture}`
    : undefined;
  const isFeed = mode === "feed";
  const isMine = mode === "mine";

  return (
    <Paper
      elevation={0}
      sx={{ bgcolor: "#fff", borderRadius: 4, mb: isFeed ? "20px" : 2.5, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}
    >
      {post.image && (
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src={resolveImageUrl(post.image)}
            alt={post.title}
            sx={{ width: "100%", height: isFeed ? 180 : 200, objectFit: "cover", display: "block" }}
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
        {!isMine && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.25 }}>
            <Avatar src={avatarSrc} sx={{ width: 36, height: 36, mr: 1.25, bgcolor: "#6344F5", fontSize: "0.85rem" }}>
              {username[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1A1A2E", lineHeight: 1.2 }}>
                {username}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#9E9EB0" }}>
                {isFeed ? timeAgo(post.createdAt) : new Date(post.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            {post.rating != null && !post.image && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>
                  {post.rating}{!isFeed && " / 5"}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: isMine ? "flex-start" : undefined, justifyContent: isMine ? "space-between" : undefined, mb: 0.25 }}>
          <Typography sx={{ fontWeight: 800, fontSize: isFeed || isMine ? "1.05rem" : "1.1rem", color: "#1A1A2E" }}>
            {post.title}
          </Typography>
          {isMine && post.rating != null && !post.image && (
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
            fontSize: isFeed || isMine ? "0.88rem" : "0.9rem", color: "#444", lineHeight: isFeed || isMine ? 1.6 : 1.7,
            mb: isFeed || isMine ? 1.25 : 0,
            ...((isFeed || isMine) && { overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }),
          }}>
            {post.content}
          </Typography>
        )}

        {isFeed && (
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
              {commentCount ?? 0} {(commentCount ?? 0) === 1 ? "Comment" : "Comments"}
            </Typography>
          </Box>
        )}

        {isMine && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box
              onClick={() => onEdit?.(post._id)}
              sx={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
                bgcolor: "#F5F5F5", borderRadius: 2, py: 1, cursor: "pointer",
                "&:hover": { bgcolor: "#EBEBF0" },
              }}
            >
              <EditOutlined sx={{ fontSize: 16, color: "#555" }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#555" }}>Edit</Typography>
            </Box>
            <Box
              onClick={() => onDelete?.(post._id)}
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
        )}
      </Box>
    </Paper>
  );
};

export default ReviewCard;