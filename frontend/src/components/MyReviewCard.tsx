import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { StarOutlined, EditOutlined, DeleteOutlined } from "@mui/icons-material";
import { type IPost } from "../services/postService";
import { resolveImageUrl } from "../utils/postUtils";

interface MyReviewCardProps {
  post: IPost;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MyReviewCard: React.FC<MyReviewCardProps> = ({ post, onEdit, onDelete }) => (
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

      <Box sx={{ display: "flex", gap: 1 }}>
        <Box
          onClick={() => onEdit(post._id)}
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
          onClick={() => onDelete(post._id)}
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
);

export default MyReviewCard;
