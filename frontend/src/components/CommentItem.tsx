import React from "react";
import { Box, Typography, Paper, IconButton } from "@mui/material";
import { DeleteOutlined } from "@mui/icons-material";
import { type IComment } from "../services/commentService";

interface CommentItemProps {
  comment: IComment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onDelete,
}) => (
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
      <Typography
        sx={{ fontSize: "0.88rem", color: "#333", lineHeight: 1.6, flex: 1 }}
      >
        {comment.content}
      </Typography>
      {currentUserId && currentUserId === comment.userId && (
        <IconButton
          size="small"
          onClick={() => onDelete(comment._id)}
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
);

export default CommentItem;
