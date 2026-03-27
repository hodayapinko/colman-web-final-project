import React, { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await postService.uploadImage(imageFile);
      }
      await postService.create({ title, content, userId: user._id, image: imageUrl });
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create post.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-page">
        <p>Please login to create a post.</p>
      </div>
    );
  }

  return (
    <div className="create-post">
      <h1>Create New Post</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
        />
        <textarea
          placeholder="Write your post content... (min 10 characters)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
          rows={8}
        />
        <div className="image-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
          />
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="image-preview" />
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? "Publishing..." : "Publish"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
