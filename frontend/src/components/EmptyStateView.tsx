import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Add } from "@mui/icons-material";

interface EmptyStateViewProps {
  illustration: React.ReactNode;
  heading: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
}

const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  illustration,
  heading,
  description,
  ctaLabel,
  onCtaClick,
}) => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      px: 3,
      gap: 3,
    }}
  >
    {illustration}

    <Typography
      variant="h5"
      sx={{ fontWeight: 700, color: "#1A1A2E", textAlign: "center", fontSize: "1.3rem" }}
    >
      {heading}
    </Typography>

    <Typography
      sx={{
        color: "#9E9EB0",
        textAlign: "center",
        fontSize: "0.9rem",
        lineHeight: 1.7,
        maxWidth: 300,
      }}
    >
      {description}
    </Typography>

    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={onCtaClick}
      sx={{
        bgcolor: "#6344F5",
        borderRadius: "50px",
        px: 4,
        py: 1.5,
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.95rem",
        boxShadow: "0 4px 16px rgba(99, 68, 245, 0.35)",
        "&:hover": { bgcolor: "#512DC8" },
      }}
    >
      {ctaLabel}
    </Button>
  </Box>
);

export default EmptyStateView;
