import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Rating,
} from "@mui/material";
import { ArrowBackOutlined, AddPhotoAlternateOutlined, LocationOnOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await postService.uploadImage(imageFile);
      }
      await postService.create({
        title,
        content,
        userId: user._id,
        image: imageUrl,
        location: location || undefined,
        rating: rating || undefined,
      });
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create review.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography>Please login to write a review.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F8F9FA", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "#fff", px: 2, py: 1.5, display: "flex", alignItems: "center", borderBottom: "1px solid #F0F0F0" }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#1A1A2E" }}>
          <ArrowBackOutlined />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A2E", flex: 1, textAlign: "center", mr: "40px" }}>
          Write a Review
        </Typography>
      </Box>

      {/* Form */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && (
          <Typography sx={{ color: "#d32f2f", fontSize: "0.85rem", px: 1 }}>{error}</Typography>
        )}

        {/* Hotel Name */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Hotel Name
          </Typography>
          <TextField
            fullWidth
            variant="standard"
            placeholder="e.g. The Plaza Hotel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontSize: "1.1rem", fontWeight: 700, color: "#1A1A2E", mt: 0.5 } }}
          />
        </Paper>

        {/* Location */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Location
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            <LocationOnOutlined sx={{ color: "#9E9EB0", fontSize: 18, mr: 0.5 }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="e.g. New York, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{ disableUnderline: true, sx: { color: "#555" } }}
            />
          </Box>
        </Paper>

        {/* Rating */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Your Rating
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
            <Rating
              value={rating}
              onChange={(_, val) => setRating(val)}
              sx={{
                "& .MuiRating-iconFilled": { color: "#FFD700" },
                "& .MuiRating-iconEmpty": { color: "#DDD" },
                fontSize: "2rem",
              }}
            />
            {rating ? (
              <Typography sx={{ fontWeight: 700, color: "#1A1A2E" }}>{rating.toFixed(1)}/5</Typography>
            ) : null}
          </Box>
        </Paper>

        {/* Review Text */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Your Review
          </Typography>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Share your experience..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={4}
            InputProps={{ disableUnderline: true, sx: { mt: 0.5, color: "#444" } }}
          />
        </Paper>

        {/* Photo Upload */}
        <Paper
          elevation={0}
          onClick={() => fileInputRef.current?.click()}
          sx={{ p: 2, borderRadius: 3, border: "1px dashed #C7B9FF", cursor: "pointer" }}
        >
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
          {imagePreview ? (
            <Box
              component="img"
              src={imagePreview}
              sx={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 2 }}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 2 }}>
              <AddPhotoAlternateOutlined sx={{ fontSize: 36, color: "#C7B9FF" }} />
              <Typography sx={{ color: "#9E9EB0", fontSize: "0.85rem" }}>Tap to add a photo</Typography>
            </Box>
          )}
        </Paper>

        {/* Submit */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={uploading}
          sx={{
            bgcolor: "#6344F5",
            borderRadius: "50px",
            py: 1.5,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "0 4px 16px rgba(99,68,245,0.35)",
            "&:hover": { bgcolor: "#512DC8" },
            mt: 1,
            mb: 3,
          }}
        >
          {uploading ? "Publishing..." : "Publish Review"}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePost;
