import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Feed from "../pages/Feed";
import CommentsPage from "../pages/CommentsPage";
import CreatePost from "../pages/CreatePost";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const guestRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const protectedRoutes = [
  { path: "/", element: <Profile /> },
  { path: "/feed", element: <Feed /> },
  { path: "/comments/:postId", element: <CommentsPage /> },
  { path: "/create", element: <CreatePost /> },
  { path: "/edit/:postId", element: <CreatePost /> },
];

const AppRoutes: React.FC = () => (
  <Routes>
    {guestRoutes.map(({ path, element }) => (
      <Route key={path} path={path} element={<GuestRoute>{element}</GuestRoute>} />
    ))}
    {protectedRoutes.map(({ path, element }) => (
      <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
    ))}
    <Route path="/profile" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
