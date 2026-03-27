import React, { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { postService, type Post } from "../services/postService";
import {
  commentService,
  type Comment as IComment,
} from "../services/commentService";
import { useAuth } from "../context/AuthContext";

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([postService.getById(id), commentService.getByPost(id)])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;
    const res = await commentService.create({
      postId: id,
      content: newComment,
      userId: user._id,
    });
    setComments([...comments, res.data]);
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    await commentService.delete(commentId);
    setComments(comments.filter((c) => c._id !== commentId));
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!post) return <p className="error">Post not found</p>;

  return (
    <div className="post-page">
      <Link to="/" className="back-link">
        &larr; Back to Feed
      </Link>
      <article className="post-full">
        <h1>{post.title}</h1>
        <span className="post-date">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
        {post.image && (
          <img src={post.image} alt={post.title} className="post-full-image" />
        )}
        <div className="post-content">{post.content}</div>
      </article>

      <section className="comments-section">
        <h2>Comments ({comments.length})</h2>
        {user ? (
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              required
            />
            <button type="submit" className="btn btn-primary">
              Post Comment
            </button>
          </form>
        ) : (
          <p>
            <Link to="/login">Login</Link> to leave a comment.
          </p>
        )}

        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment._id} className="comment-card">
              <p>{comment.content}</p>
              <div className="comment-meta">
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                {user && user._id === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PostPage;
