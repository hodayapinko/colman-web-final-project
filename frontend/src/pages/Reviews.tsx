import { Box } from "@mui/material";
import { HomeOutlined, StarOutline } from "@mui/icons-material";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";

const Reviews: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login"); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F7FB", display: "flex", flexDirection: "column", pb: "70px" }}>
      <PageTopBar
        icon={<HomeOutlined sx={{ color: "#6344F5", fontSize: 20 }} />}
        iconBg="#EDE9FF"
        title="My Reviews"
        subtitle="0 reviews"
        onLogout={handleLogout}
      />
      <EmptyStateView
        illustration={
          <Box sx={{ width: 160, height: 160, borderRadius: "50%", bgcolor: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <StarOutline sx={{ fontSize: 72, color: "#6344F5" }} />
          </Box>
        }
        heading="No Reviews Yet"
        description="Start your journey by sharing your first hotel experience. Your reviews help others make better travel decisions!"
        ctaLabel="Add Your First Review"
        onCtaClick={() => navigate("/create")}
      />
      <AppBottomNav activeIndex={0} />
    </Box>
  );
};

export default Reviews;
