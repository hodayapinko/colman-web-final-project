import React from "react";
import "./AuthIcon.css";

const AuthIcon: React.FC = () => (
  <div className="auth-logo">
    <div className="auth-logo-circle">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    </div>
    <div className="auth-logo-badge">★</div>
  </div>
);

export default AuthIcon;
