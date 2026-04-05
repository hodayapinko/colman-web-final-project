import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { LogoutOutlined, ArrowBackOutlined } from "@mui/icons-material";

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  icon?: React.ReactNode;
  iconBg?: string;
  onLogout?: () => void;
  profilePicture?: string;
}

const PageTopBar: React.FC<PageTopBarProps> = ({
  title,
  subtitle,
  onBack,
  icon,
  iconBg = "#EDE9FF",
  onLogout,
  profilePicture,
}) => (
  <Box
    sx={{
      bgcolor: "#fff",
      px: 2,
      py: 1.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #F0F0F0",
    }}
  >
    {/* Left side */}
    {onBack ? (
      <IconButton onClick={onBack} sx={{ color: "#1A1A2E" }} size="small">
        <ArrowBackOutlined />
      </IconButton>
    ) : (
      <Box
        sx={{
          bgcolor: iconBg,
          borderRadius: "10px",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
    )}

    {/* Center */}
    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#1A1A2E",
          fontSize: "1rem",
          lineHeight: 1.2,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "#9E9EB0", fontSize: "0.75rem" }}>
          {subtitle}
        </Typography>
      )}
    </Box>

    {/* Right side */}
    {onLogout ? (
      profilePicture ? (
        <IconButton onClick={onLogout} sx={{ p: 0 }} size="small">
          <img
            src={profilePicture}
            alt="Profile"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </IconButton>
      ) : (
        <IconButton onClick={onLogout} sx={{ color: "#9E9EB0" }} size="small">
          <LogoutOutlined fontSize="small" />
        </IconButton>
      )
    ) : (
      <Box sx={{ width: 34 }} />
    )}
  </Box>
);

export default PageTopBar;
