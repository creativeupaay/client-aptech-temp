import React from "react";
import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "../features/auth/authApi";
import { LoadingSpinner } from "../components/feedback";
import { useDelayedLoading } from "../hooks/useDelayedLoading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("tbx_auth_token");
  const { isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Only display the full-screen spinner if auth takes longer than 250ms
  const showSpinner = useDelayedLoading(Boolean(token && isLoading), 250);

  // If no token exists, immediately redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If session check failed (e.g. invalid/expired token), clean up and redirect
  if (isError) {
    localStorage.removeItem("tbx_auth_token");
    localStorage.removeItem("tbx_student_user");
    return <Navigate to="/login" replace />;
  }

  // If still verifying within the 250ms threshold, render a clean blank background
  // to prevent the jarring spinner flash / layout jerk on page refresh
  if (isLoading) {
    if (showSpinner) {
      return <LoadingSpinner message="Authenticating student session..." fullScreen />;
    }
    return <div className="min-h-screen bg-[#F4F5F7]" />;
  }

  return <>{children}</>;
};
