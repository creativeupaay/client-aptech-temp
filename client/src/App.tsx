import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AccessViaProconnectPage, SSOCallbackPage } from "./features/auth";
import { StudentDashboardPage } from "./features/dashboard";
import {
  CardIssuancePage,
  CardStatusPage,
  LoadMoneyPage,
  KycVerificationPage,
} from "./features/card";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route renders AccessViaProconnectPage (or redirects to dashboard if authenticated) */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <AccessViaProconnectPage />
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

        {/* Card Issuance Status & Celebration Flow */}
        <Route
          path="/card/status"
          element={
            <ProtectedRoute>
              <CardStatusPage />
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

        {/* Catch-all redirects to root SSO entrance */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
