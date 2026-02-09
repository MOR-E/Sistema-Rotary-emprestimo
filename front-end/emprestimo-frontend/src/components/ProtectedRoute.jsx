import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const tokenWrapper = window.localStorage.getItem("tokenWrapper");
  let token = null;
  if (tokenWrapper) {
    try {
      token = JSON.parse(tokenWrapper).token;
    } catch (err) {
      token = null;
    }
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
