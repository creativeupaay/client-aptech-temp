import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeftBrandBanner } from "./components/LeftBrandBanner";
import { SignupForm } from "./components/SignupForm";
import { OtpVerificationCard } from "./components/OtpVerificationCard";
import { LoginForm } from "./components/LoginForm";
import type { AuthSuccessResponse } from "./authApi";

export interface AuthPageProps {
  initialMode?: "signup" | "login";
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = "signup" }) => {
  const navigate = useNavigate();
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [registeredMobile, setRegisteredMobile] = useState<string>("");
  const [debugOtp, setDebugOtp] = useState<string | undefined>(undefined);

  const handleSignupSuccess = (mobile: string, receivedDebugOtp?: string) => {
    setRegisteredMobile(mobile);
    setDebugOtp(receivedDebugOtp);
    setIsOtpMode(true);
  };

  const handleVerificationSuccess = (_data: AuthSuccessResponse["data"]) => {
    navigate("/dashboard", { replace: true });
  };

  const handleLoginSuccess = (_data: AuthSuccessResponse["data"]) => {
    navigate("/dashboard", { replace: true });
  };

  const handleUnverifiedMobile = (mobile: string) => {
    setRegisteredMobile(mobile);
    setIsOtpMode(true);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-aptech-warm overflow-x-hidden">
      {/* Split Left: Aptech Brand Banner */}
      <div className="w-full lg:w-1/2 flex min-w-0">
        <LeftBrandBanner />
      </div>

      {/* Split Right: Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 lg:p-12 xl:p-16 bg-white overflow-y-auto min-w-0">
        {isOtpMode ? (
          <OtpVerificationCard
            mobile={registeredMobile}
            initialDebugOtp={debugOtp}
            onVerificationSuccess={handleVerificationSuccess}
            onBackToSignup={() => setIsOtpMode(false)}
          />
        ) : initialMode === "login" ? (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => navigate("/signup")}
            onUnverifiedMobile={handleUnverifiedMobile}
          />
        ) : (
          <SignupForm
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => navigate("/login")}
          />
        )}
      </div>
    </div>
  );
};
