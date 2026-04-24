import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { PersonOutlined } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useProfileForm } from "../utils/profile/profileUtils";
import { useLogout } from "../utils/authUtils";
import ProfileHeader from "../components/profile/ProfileHeader";
import PageTopBar from "../components/PageTopBar";
import AppBottomNav from "../components/AppBottomNav";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const form = useProfileForm();

  if (!user) return null;

  if (form.loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#6344F5" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      <PageTopBar
        icon={<PersonOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="My Profile"
        subtitle="Manage your account"
        onLogout={handleLogout}
      />

      <ProfileHeader
        isEditing={true}
        form={form}
        avatarSrc={user.profilePicture || null}
        username={user.username || ""}
        reviewCount={0}
        onEdit={() => {}}
      />

      <AppBottomNav activeIndex={3} />
    </Box>
  );
};

export default Profile;
