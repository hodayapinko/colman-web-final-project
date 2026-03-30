import React, { useState, useRef, useEffect } from "react";
import {
  Box, Typography, IconButton, TextField, Button, Paper, Rating, CircularProgress,
} from "@mui/material";
import {
  ArrowBackOutlined, AddPhotoAlternateOutlined, LocationOnOutlined,
  StarOutlined, ApartmentOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";

const CreatePost: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const isEditMode = Boolean(postId);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!postId) return;
    postService.getById(postId)
      .then((post) => {
        setTitle(post.title);
        setCity(post.location || "");
        setContent(post.content);
        setRating(post.rating ?? null);
        if (post.image) setExistingImageUrl(post.image);
      })
      .catch(() => setError("Failed to load review."))
      .finally(() => setLoadingPost(false));
  }, [postId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (isSubmittingRef.current) return;
    if (!title.trim()) { setError("Hotel name is required."); return; }
    if (!city.trim()) { setError("City is required."); return; }
    setError("");
    isSubmittingRef.current = true;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await postService.uploadImage(imageFile);
      } else if (isEditMode) {
        // in edit mode: keep existing URL, or "" to signal removal to the backend
        imageUrl = existingImageUrl ?? "";
      }

      if (isEditMode && postId) {
        await postService.update(postId, {
          title,
          content,
          image: imageUrl,
          location: city,
          rating: rating || undefined,
        });
      } else {
        await postService.create({
          title,
          content,
          userId: user._id,
          image: imageUrl,
          location: city,
          rating: rating || undefined,
        });
      }
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || (isEditMode ? "Failed to update review." : "Failed to create review."));
    } finally {
      setUploading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography>Please login to write a review.</Typography>
      </Box>
    );
  }

  if (loadingPost) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#6344F5" }} />
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
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, ml: 1 }}>
          <Box sx={{ position: "relative" }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ApartmentOutlined sx={{ color: "#6344F5", fontSize: 22 }} />
            </Box>
            <Box sx={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", bgcolor: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <StarOutlined sx={{ fontSize: 10, color: "#fff" }} />
            </Box>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1A1A2E", lineHeight: 1.2, fontSize: "1rem" }}>
              {isEditMode ? "Edit Review" : "Add Hotel Review"}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#9E9EB0" }}>{isEditMode ? "Update your experience" : "Share your experience"}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Form */}
      <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 2, pb: 4 }}>
        {error && (
          <Typography sx={{ color: "#d32f2f", fontSize: "0.85rem", px: 1 }}>{error}</Typography>
        )}

        {/* Hotel Name + City */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Hotel Name <Box component="span" sx={{ color: "#d32f2f" }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              variant="standard"
              placeholder="e.g. The Plaza Hotel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              InputProps={{ disableUnderline: true, sx: { fontSize: "1rem", fontWeight: 700, color: "#1A1A2E", mt: 0.5 } }}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              City <Box component="span" sx={{ color: "#d32f2f" }}>*</Box>
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
              <LocationOnOutlined sx={{ color: "#9E9EB0", fontSize: 18, mr: 0.5 }} />
              <TextField
                fullWidth
                variant="standard"
                placeholder="e.g. New York, USA"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                InputProps={{ disableUnderline: true, sx: { color: "#555" } }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Image Upload */}
        <Paper
          elevation={0}
          onClick={() => !imagePreview && !existingImageUrl && fileInputRef.current?.click()}
          sx={{ borderRadius: 3, border: "1px dashed #C7B9FF", cursor: (imagePreview || existingImageUrl) ? "default" : "pointer", overflow: "hidden" }}
        >
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleImageChange} />
          {imagePreview || existingImageUrl ? (
            <Box sx={{ position: "relative" }}>
              <Box component="img" src={imagePreview ?? existingImageUrl!} sx={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
              <Button
                onClick={(e) => { handleRemoveImage(e); setExistingImageUrl(null); }}
                size="small"
                sx={{
                  position: "absolute", top: 8, right: 8,
                  bgcolor: "#d32f2f", color: "#fff", borderRadius: 2, px: 1.5, py: 0.5,
                  fontSize: "0.75rem", fontWeight: 700, textTransform: "none", minWidth: "auto",
                  "&:hover": { bgcolor: "#b71c1c" },
                }}
              >
                Remove
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 3 }}>
              <AddPhotoAlternateOutlined sx={{ fontSize: 36, color: "#C7B9FF" }} />
              <Typography sx={{ color: "#9E9EB0", fontSize: "0.85rem" }}>Tap to add a photo</Typography>
            </Box>
          )}
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
              sx={{ "& .MuiRating-iconFilled": { color: "#FFD700" }, "& .MuiRating-iconEmpty": { color: "#DDD" }, fontSize: "2rem" }}
            />
          </Box>
          {rating ? (
            <Typography sx={{ fontSize: "0.8rem", color: "#9E9EB0", mt: 0.5 }}>{rating} out of 5 stars</Typography>
          ) : null}
        </Paper>

        {/* Description */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #EBEBF0" }}>
          <Typography variant="caption" sx={{ color: "#9E9EB0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Description
          </Typography>
          <TextField
            fullWidth
            variant="standard"
            placeholder="Share your experience..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            minRows={4}
            inputProps={{ maxLength: 500 }}
            InputProps={{ disableUnderline: true, sx: { mt: 0.5, color: "#444" } }}
          />
          <Typography sx={{ fontSize: "0.75rem", color: "#9E9EB0", textAlign: "right", mt: 0.5 }}>
            {content.length}/500
          </Typography>
        </Paper>

        {/* Submit */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={uploading}
          fullWidth
          sx={{
            bgcolor: "#6344F5", borderRadius: "50px", py: 1.5,
            textTransform: "none", fontWeight: 700, fontSize: "1rem",
            boxShadow: "0 4px 16px rgba(99,68,245,0.35)",
            "&:hover": { bgcolor: "#512DC8" }, mt: 1, mb: 3,
          }}
        >
          {uploading ? (isEditMode ? "Saving..." : "Publishing...") : (isEditMode ? "Save Changes" : "Submit Review")}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePost;