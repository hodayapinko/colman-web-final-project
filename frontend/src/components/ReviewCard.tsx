import React from "react";
import { Box, Typography, Avatar, Paper } from "@mui/material";
import { StarOutlined } from "@mui/icons-material";
import { type IPost, type IPostUser } from "../services/postService";

interface ReviewCardProps {
  post: IPost;
}

const getPostUser = (post: IPost): IPostUser | null =>
  post.user && typeof post.user === "object" ? (post.user as IPostUser) : null;

const ReviewCard: React.FC<ReviewCardProps> = ({ post }) => {
  const postUser = getPostUser(post);
  const username = postUser?.username ?? "User";
  const avatarSrc = postUser?.profilePicture
    ? `http://localhost:3000/public/${postUser.profilePicture}`
    : undefined;

  return (
    <Paper
      elevation={0}
      sx={{ bgcolor: "#fff", borderRadius: 4, mb: 2.5, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}
    >
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
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1A1A2E", lineHeight: 1.2 }}>
              {username}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#9E9EB0" }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          {post.rating != null && !post.image && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
              <StarOutlined sx={{ fontSize: 14, color: "#FFD700" }} />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1A1A2E" }}>{post.rating} / 5</Typography>
            </Box>
          )}
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#1A1A2E", mb: 0.25 }}>
          {post.title}
        </Typography>
        {post.location && (
          <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0", mb: 0.75 }}>{post.location}</Typography>
        )}
        {post.content && (
          <Typography sx={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.7 }}>{post.content}</Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ReviewCard;
