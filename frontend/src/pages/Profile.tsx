import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { PersonOutlined } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useProfileForm } from "../utils/profile/profileUtils";
import { useLogout } from "../utils/authUtils";
import ProfileForm from "../components/ProfileForm";
import PageTopBar from "../components/PageTopBar";
import AppBottomNav from "../components/AppBottomNav";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const form = useProfileForm();

  if (!user) return null;

  if (form.loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#6344F5" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        pb: "80px",
      }}
    >
      <PageTopBar
        icon={<PersonOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="My Profile"
        subtitle="Manage your account"
        onLogout={handleLogout}
      />

      <ProfileForm
        fields={form.fields}
        avatarSrc={form.avatarSrc}
        handleImageChange={form.handleImageChange}
        handleSaveChanges={form.handleSaveChanges}
        saving={form.saving}
        hasProfileChange={form.hasProfileChange}
        error={form.error}
      />

      <AppBottomNav activeIndex={3} />
    </Box>
  );
};

export default Profile;