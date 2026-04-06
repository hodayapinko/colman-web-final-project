import React from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { IProfileField } from "../utils/profile/types";
import EditUserProfileHeader from "./EditUserProfileHeader";
import ProfileFields from "./ProfileFields";

interface IProfileFormProps {
  fields: IProfileField[];
  avatarSrc?: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveChanges: () => void;
  saving: boolean;
  hasProfileChange: boolean;
  error?: string;
}

const ProfileForm: React.FC<IProfileFormProps> = ({
  fields = [],
  avatarSrc,
  handleImageChange,
  handleSaveChanges,
  saving,
  hasProfileChange,
  error,
}) => {
  return (
    <Box sx={{ px: 2, pb: 4 }}>
      <EditUserProfileHeader src={avatarSrc} onImageChange={handleImageChange} />

      {error ? (
        <Typography sx={{ color: "#d32f2f", mb: 2 }}>{error}</Typography>
      ) : null}

      <ProfileFields fields={fields} />

      <Button
        fullWidth
        variant="contained"
        onClick={handleSaveChanges}
        disabled={saving || !hasProfileChange}
        sx={{
          mt: 4,
          borderRadius: 3,
          py: 1.5,
          fontWeight: 700,
          textTransform: "none",
          bgcolor: "#6344F5",
          "&:hover": {
            bgcolor: "#5437e6",
          },
        }}
      >
        {saving ? (
          <CircularProgress size={22} sx={{ color: "#fff" }} />
        ) : (
          "Save Profile"
        )}
      </Button>
    </Box>
  );
};

export default ProfileForm;
