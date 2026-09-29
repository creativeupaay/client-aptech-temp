import React from "react";
import { Navigate } from "react-router-dom";
import { useGetMeQuery } from "../features/auth/authApi";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = localStorage.getItem("tbx_auth_token");
  const { data, isSuccess } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // If already logged in and verified, redirect directly to student dashboard
  if (token && isSuccess && data?.data?.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
