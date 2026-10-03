import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage, SSOCallbackPage } from "./features/auth";
import { StudentDashboardPage } from "./features/dashboard";
import {
  CardIssuancePage,
  LoadMoneyPage,
  KycVerificationPage,
} from "./features/card";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to signup if guest, dashboard if logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/signup" replace />
            </PublicRoute>
          }
        />

        {/* Public guest routes */}
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <AuthPage initialMode="signup" />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage initialMode="login" />
            </PublicRoute>
          }
        />

        {/* ProConnect SSO Callback Route (Zero-PII Authorization Code Exchange) */}
        <Route path="/sso/callback" element={<SSOCallbackPage />} />

        {/* Protected student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Card Issuance Flow */}
        <Route
          path="/card/issuance"
          element={
            <ProtectedRoute>
              <CardIssuancePage />
            </ProtectedRoute>
          }
        />

        {/* Load Money Flow */}
        <Route
          path="/load-money"
          element={
            <ProtectedRoute>
              <LoadMoneyPage />
            </ProtectedRoute>
          }
        />

        {/* Full KYC Flow */}
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <KycVerificationPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
