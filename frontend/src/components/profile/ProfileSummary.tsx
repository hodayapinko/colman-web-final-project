import React from "react";
import { Avatar, Box, IconButton, Typography } from "@mui/material";
import { EditOutlined, PersonOutlined } from "@mui/icons-material";

interface ProfileSummaryProps {
  avatarSrc: string | null;
  username: string;
  reviewCount: number;
  onEdit: () => void;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  avatarSrc,
  username,
  reviewCount,
  onEdit,
}) => {
  return (
    <Box sx={{ px: 2, py: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={avatarSrc || undefined}
          sx={{
            width: 72,
            height: 72,
            bgcolor: "#EDE9FF",
            color: "#6344F5",
          }}
        >
          <PersonOutlined fontSize="large" />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1A1A2E",
                fontSize: "1.1rem",
                lineHeight: 1.3,
              }}
            >
              {username}
            </Typography>

            <IconButton
              onClick={onEdit}
              size="small"
              aria-label="Edit profile"
              sx={{ color: "#6344F5" }}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Box>

          <Typography
            sx={{
              color: "#6344F5",
              fontSize: "0.8rem",
              fontWeight: 600,
              mt: 1,
            }}
          >
            {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileSummary;
