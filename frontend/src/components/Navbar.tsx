import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // still clear local state on failure
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        Blog
      </Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/create" className="btn btn-small">
              + New Post
            </Link>
            <div className="nav-user-info">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username || "Profile"}
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="nav-avatar-placeholder">
                  {(user?.username || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="nav-user">{user?.username || "User"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-small btn-outline"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-small">
              Login
            </Link>
            <Link to="/register" className="btn btn-small btn-outline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
