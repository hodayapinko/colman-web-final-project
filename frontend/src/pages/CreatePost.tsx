import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { postService } from "../services/postService";
import { useAuth } from "../context/AuthContext";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    try {
      await postService.create({ title, content, userId: user._id });
      navigate("/");
    } catch {
      setError("Failed to create post. Make sure content is at least 10 characters.");
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
        <button type="submit" className="btn btn-primary">
          Publish
        </button>
      </form>
    </div>
  );
}
