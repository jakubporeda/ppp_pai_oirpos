// src/components/ProtectedRoute/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const role = localStorage.getItem("role");

  if (role !== "Owner") {
    return <Navigate to="/owner-login" replace />;
  }

  return children;
};

export default ProtectedRoute;
