import { Box } from "@mui/material";
import { LanguageOutlined, StarOutlined } from "@mui/icons-material";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageTopBar from "../components/PageTopBar";
import EmptyStateView from "../components/EmptyStateView";
import AppBottomNav from "../components/AppBottomNav";

const Feed: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } finally { navigate("/login"); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F7FB", display: "flex", flexDirection: "column", pb: "70px" }}>
      <PageTopBar
        icon={<LanguageOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="Global Feed"
        subtitle="0 reviews"
        onLogout={handleLogout}
      />
      <EmptyStateView
        illustration={
          <Box sx={{ position: "relative", width: 160, height: 160 }}>
            <Box sx={{ width: 160, height: 160, borderRadius: "50%", bgcolor: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LanguageOutlined sx={{ fontSize: 72, color: "#6344F5" }} />
            </Box>
            <Box sx={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", bgcolor: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(245,166,35,0.5)" }}>
              <StarOutlined sx={{ fontSize: 16, color: "#fff" }} />
            </Box>
          </Box>
        }
        heading="No Reviews in Feed"
        description="The community feed is empty. Be the first to share a hotel review and inspire other travelers!"
        ctaLabel="Share First Review"
        onCtaClick={() => navigate("/create")}
      />
      <AppBottomNav activeIndex={1} />
    </Box>
  );
};

export default Feed;

