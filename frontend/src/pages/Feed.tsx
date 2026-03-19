import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { postService } from "../services/postService";
import type { Post } from "../services/postService";

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postService
      .getAll()
      .then((data) => setPosts(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading posts...</p>;

  return (
    <div className="feed">
      <div className="feed-header">
        <h1>Blog Feed</h1>
        <Link to="/create" className="btn btn-primary">
          + New Post
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="empty">No posts yet. Be the first to share something!</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <Link to={`/post/${post._id}`} key={post._id} className="post-card">
              <h2>{post.title}</h2>
              <p>{post.content.substring(0, 150)}...</p>
              <span className="post-date">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
