import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Feed from "../pages/Feed";
import CommentsPage from "../pages/CommentsPage";
import CreatePost from "../pages/CreatePost";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Reviews from "../pages/Reviews";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <GuestRoute>
          <Login />
        </GuestRoute>
      }
    />
    <Route
      path="/register"
      element={
        <GuestRoute>
          <Register />
        </GuestRoute>
      }
    />

    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Reviews />
        </ProtectedRoute>
      }
    />
    <Route
      path="/feed"
      element={
        <ProtectedRoute>
          <Feed />
        </ProtectedRoute>
      }
    />
    <Route
      path="/comments/:postId"
      element={
        <ProtectedRoute>
          <CommentsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/create"
      element={
        <ProtectedRoute>
          <CreatePost />
        </ProtectedRoute>
      }
    />
    <Route
      path="/edit/:postId"
      element={
        <ProtectedRoute>
          <CreatePost />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AppRoutes;
