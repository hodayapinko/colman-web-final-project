import React from "react";
import { Box, Paper, TextField, Typography } from "@mui/material";
import type { IProfileField } from "../utils/profile/types";

interface ProfileFieldsProps {
  fields: IProfileField[];
}

const ProfileFields: React.FC<ProfileFieldsProps> = ({ fields }) => {
  return (
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
  );
};

export default ProfileFields;
