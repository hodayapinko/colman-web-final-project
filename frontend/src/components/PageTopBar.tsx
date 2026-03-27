import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { LogoutOutlined } from "@mui/icons-material";

interface PageTopBarProps {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onLogout: () => void;
}

const PageTopBar: React.FC<PageTopBarProps> = ({
  icon,
  iconBg = "#EDE9FF",
  title,
  subtitle,
  onLogout,
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

    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: "#1A1A2E", fontSize: "1rem", lineHeight: 1.2 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "#9E9EB0", fontSize: "0.75rem" }}>
          {subtitle}
        </Typography>
      )}
    </Box>

    <IconButton onClick={onLogout} sx={{ color: "#9E9EB0" }} size="small">
      <LogoutOutlined fontSize="small" />
    </IconButton>
  </Box>
);

export default PageTopBar;
