import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { StarOutlined, ChatBubbleOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { type IPost } from "../services/postService";
import { getPostUser, timeAgo, resolveImageUrl } from "../utils/postUtils";

interface FeedPostCardProps {
  post: IPost;
  commentCount: number;
}

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, commentCount }) => {
  const navigate = useNavigate();
  const postUser = getPostUser(post);
  const username = postUser?.username ?? "User";
  const avatarSrc = postUser?.profilePicture
    ? `http://localhost:3000/public/${postUser.profilePicture}`
    : undefined;

  return (
    <Paper
      elevation={0}
      sx={{ bgcolor: "#fff", borderRadius: 4, mb: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}
    >
      {post.image && (
        <Box sx={{ position: "relative" }}>
          <Box
            component="img"
            src={resolveImageUrl(post.image)}
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

      <Box sx={{ p: 2 }}>
        {/* User row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.25 }}>
          <Avatar src={avatarSrc} sx={{ width: 36, height: 36, mr: 1.25, bgcolor: "#6344F5", fontSize: "0.85rem" }}>
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
            {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default FeedPostCard;
