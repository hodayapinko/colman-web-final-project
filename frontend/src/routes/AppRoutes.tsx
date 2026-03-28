import React from "react";
import { Routes, Route } from "react-router-dom";
import Feed from "../pages/Feed";
import PostPage from "../pages/PostPage";
import CreatePost from "../pages/CreatePost";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Reviews from "../pages/Reviews";

const routeConfig = [
  { path: "/", element: <Reviews /> },
  { path: "/feed", element: <Feed /> },
  { path: "/comments/:postId", element: <PostPage /> },
  { path: "/create", element: <CreatePost /> },
  { path: "/edit/:postId", element: <CreatePost /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
];

const AppRoutes: React.FC = () => (
  <Routes>
    {routeConfig.map(({ path, element }) => (
      <Route key={path} path={path} element={element} />
    ))}
  </Routes>
);

export default AppRoutes;
