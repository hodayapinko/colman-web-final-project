import React, { useId } from "react";
import { Avatar, Box } from "@mui/material";
import { AddAPhotoOutlined, PersonOutlined } from "@mui/icons-material";

interface IEditUserProfileHeader {
  src?: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EditUserProfileHeader: React.FC<IEditUserProfileHeader> = ({ src, onImageChange }) => {
  const inputId = useId();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={src || undefined}
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
          onChange={onImageChange}
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
  );
};

export default EditUserProfileHeader;
