import React from "react";
import { Box } from "@mui/material";
import { StarOutlined, LanguageOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export interface IEmptyStateConfig {
  illustration: React.ReactNode;
  heading: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
}

export function useNoReviewsEmptyState(
  description = "Start your journey by sharing your first hotel experience."
): IEmptyStateConfig {
  const navigate = useNavigate();
  return {
    illustration: (
      <Box
        sx={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          bgcolor: "#EDE9FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StarOutlined sx={{ fontSize: 72, color: "#6344F5" }} />
      </Box>
    ),
    heading: "No Reviews Yet",
    description,
    ctaLabel: "Add Your First Review",
    onCtaClick: () => navigate("/create"),
  };
}

export function useFeedEmptyState(): IEmptyStateConfig {
  const navigate = useNavigate();
  return {
    illustration: (
      <Box sx={{ position: "relative", width: 160, height: 160 }}>
        <Box
          sx={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            bgcolor: "#EDE9FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LanguageOutlined sx={{ fontSize: 72, color: "#6344F5" }} />
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "#F5A623",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(245,166,35,0.5)",
          }}
        >
          <StarOutlined sx={{ fontSize: 16, color: "#fff" }} />
        </Box>
      </Box>
    ),
    heading: "No Reviews in Feed",
    description:
      "The community feed is empty. Be the first to share a hotel review and inspire other travelers!",
    ctaLabel: "Share First Review",
    onCtaClick: () => navigate("/create"),
  };
}
