import React from "react";
import { Box, Typography, Paper, IconButton, Avatar } from "@mui/material";
import { DeleteOutlined } from "@mui/icons-material";
import { type IComment, type ICommentUser } from "../services/commentService";
import { API_BASE_URL } from "../services/api";

interface CommentItemProps {
  comment: IComment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}

const getCommentUser = (userId: IComment["userId"]): ICommentUser | null =>
  userId && typeof userId === "object" ? (userId as ICommentUser) : null;

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onDelete,
}) => {
  const commentUser = getCommentUser(comment.userId);
  const username = commentUser?.username ?? "User";
  const ownerId =
    commentUser?._id ?? (typeof comment.userId === "string" ? comment.userId : "");

  const avatarSrc = commentUser?.profilePicture
    ? commentUser.profilePicture.startsWith("http")
      ? commentUser.profilePicture
      : `${API_BASE_URL}/public/${commentUser.profilePicture}`
    : undefined;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#fff",
        borderRadius: 3,
        p: 1.75,
        mb: 1.25,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", flex: 1, gap: 1.25 }}>
          <Avatar
            src={avatarSrc}
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#6344F5",
              fontSize: "0.8rem",
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            {username[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#1A1A2E", lineHeight: 1.3 }}
            >
              {username}
            </Typography>
            <Typography
              sx={{ fontSize: "0.88rem", color: "#333", lineHeight: 1.6, mt: 0.25 }}
            >
              {comment.content}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#9E9EB0", mt: 0.5 }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        {currentUserId && currentUserId === ownerId && (
          <IconButton
            size="small"
            onClick={() => onDelete(comment._id)}
            sx={{ color: "#d32f2f", ml: 1, p: 0.5, flexShrink: 0 }}
          >
            <DeleteOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default CommentItem;
