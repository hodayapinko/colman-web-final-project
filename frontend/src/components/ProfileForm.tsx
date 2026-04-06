import React, { useId } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { AddAPhotoOutlined, PersonOutlined } from "@mui/icons-material";
import type { IProfileField } from "../utils/profile/types";

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
  const inputId = useId();

  return (
    <Box sx={{ px: 2, pb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={avatarSrc || undefined}
            sx={{
              width: 90,
              height: 90,
              bgcolor: "#EDE9FF",
              color: "#6344F5",
            }}
          >
            <PersonOutlined fontSize="large" />
          </Avatar>

          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />

          <label htmlFor={inputId}>
            <Box
              sx={{
                position: "absolute",
                bottom: -5,
                right: -5,
                bgcolor: "#6344F5",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <AddAPhotoOutlined sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
          </label>
        </Box>
      </Box>

      {error ? (
        <Typography sx={{ color: "#d32f2f", mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {fields.map((field) => (
          <Paper
            key={field.key}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#6B7280",
                mb: 1,
              }}
            >
              {field.label}
            </Typography>

            <TextField
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              fullWidth
              size="small"
              type={field.type || "text"}
              multiline={field.multiline}
              minRows={field.minRows}
              inputProps={
                field.maxLength ? { maxLength: field.maxLength } : undefined
              }
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#F9FAFB",
                },
              }}
            />
          </Paper>
        ))}
      </Box>

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