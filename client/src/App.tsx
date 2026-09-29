import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./features/auth";
import { StudentDashboardPage } from "./features/dashboard";
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

        {/* Protected student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboardPage />
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
