import React, { useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { PersonOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfileForm } from "../utils/profile/profileUtils";
import { useLogout } from "../utils/authUtils";
import { useUserPosts } from "../utils/useUserPosts";
import { useCommentCounts } from "../utils/useCommentCounts";
import { useNoReviewsEmptyState } from "../utils/emptyStateConfig";
import ProfileHeader from "../components/profile/ProfileHeader";
import PageTopBar from "../components/PageTopBar";
import ReviewList from "../components/ReviewList";
import AppBottomNav from "../components/AppBottomNav";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const form = useProfileForm();
  const [isEditing, setIsEditing] = useState(false);
  const { posts, isLoading, deletePost } = useUserPosts(user?._id, [isEditing]);
  const commentCounts = useCommentCounts(posts);
  const noReviewsEmptyState = useNoReviewsEmptyState();

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
        height: "100vh",
        bgcolor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <PageTopBar
          icon={<PersonOutlined sx={{ color: "#fff", fontSize: 20 }} />}
          iconBg="#6344F5"
          title="My Profile"
          subtitle="Manage your account"
          onLogout={isEditing ? undefined : handleLogout}
          onBack={isEditing ? () => setIsEditing(false) : undefined}
        />

        <ProfileHeader
          isEditing={isEditing}
          form={form}
          avatarSrc={user.profilePicture || null}
          username={user.username || ""}
          reviewCount={posts.length}
          onEdit={() => setIsEditing(true)}
        />
      </Box>

      {!isEditing ? (
        <Box sx={{ flex: 1, px: 2, pt: 2, overflowY: "auto", pb: "80px" }}>
          <ReviewList
            posts={posts}
            isLoading={isLoading}
            commentCounts={commentCounts}
            mode="mine"
            emptyState={noReviewsEmptyState}
            onEdit={(id) => navigate(`/edit/${id}`)}
            onDelete={deletePost}
          />
        </Box>
      ) : null}

      <AppBottomNav activeIndex={0} />
    </Box>
  );
};

export default Profile;
