import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useVerifyOtpMutation, useResendOtpMutation, type AuthSuccessResponse } from "../authApi";

interface OtpVerificationCardProps {
  mobile: string;
  initialDebugOtp?: string;
  onVerificationSuccess: (data: AuthSuccessResponse["data"]) => void;
  onBackToSignup: () => void;
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  mobile,
  initialDebugOtp,
  onVerificationSuccess,
  onBackToSignup,
}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [debugOtp, setDebugOtp] = useState<string | undefined>(initialDebugOtp);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(45);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setErrorMessage(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleAutoFillDebugOtp = () => {
    if (!debugOtp) return;
    const digits = debugOtp.split("").slice(0, 6);
    setOtpDigits(digits);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join("");

    if (fullOtp.length < 6) {
      setErrorMessage("Please enter all 6 digits of the OTP code.");
      return;
    }

    try {
      const response = await verifyOtp({
        mobile,
        otp: fullOtp,
      }).unwrap();

      if (response.data.token) {
        localStorage.setItem("tbx_auth_token", response.data.token);
        localStorage.setItem("tbx_student_user", JSON.stringify(response.data.user));
      }

      onVerificationSuccess(response.data);
    } catch (err: unknown) {
      interface ApiErrorData {
        data?: { message?: string };
      }
      const apiErr = err as ApiErrorData;
      setErrorMessage(apiErr?.data?.message || "Invalid OTP code. Please check and try again.");
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setErrorMessage(null);
    try {
      const response = await resendOtp({ mobile }).unwrap();
      if (response.data?.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }
      setCountdown(45);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      interface ApiErrorData {
        data?: { message?: string };
      }
      const apiErr = err as ApiErrorData;
      setErrorMessage(apiErr?.data?.message || "Failed to resend OTP. Please try again.");
    }
  };

  const maskedMobile =
    mobile.length >= 10
      ? `+91 ${mobile.slice(0, 2)}••••••${mobile.slice(-2)}`
      : mobile;

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Back button */}
      <button
        type="button"
        onClick={onBackToSignup}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-aptech-primary mb-5 cursor-pointer transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Change registration details</span>
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-aptech-primary/10 text-aptech-primary inline-flex items-center justify-center mb-4">
          <ShieldCheck size={30} />
        </div>
        <h2 className="text-2xl font-extrabold text-aptech-charcoal tracking-tight mb-2">
          Verify Mobile Number
        </h2>
        <p className="text-sm text-gray-500">
          We have sent a 6-digit verification code to
          <br />
          <strong className="text-aptech-charcoal font-bold">{maskedMobile}</strong>
        </p>
      </div>

      {/* Mock SMS Notice with 1-click fill */}
      {debugOtp && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-dashed border-amber-300 mb-5 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" />
            <span className="text-amber-900 font-semibold">
              Dev OTP:{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">
                {debugOtp}
              </code>
            </span>
          </div>
          <button
            type="button"
            onClick={handleAutoFillDebugOtp}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm mb-5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6 OTP Input Boxes */}
      <form onSubmit={handleVerify}>
        <div className="flex justify-center gap-2 sm:gap-2.5 mb-6">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center text-xl sm:text-2xl font-bold text-aptech-charcoal rounded-lg border bg-white transition-all outline-none ${
                digit
                  ? "border-aptech-primary ring-2 ring-aptech-primary/15 shadow-sm"
                  : "border-aptech-border focus:border-aptech-primary focus:ring-2 focus:ring-aptech-primary/15"
              }`}
            />
          ))}
        </div>

        {/* Verify CTA Button */}
        <button
          type="submit"
          disabled={isVerifying || otpDigits.join("").length < 6}
          className="w-full h-12 bg-aptech-primary hover:bg-aptech-primary-hover text-white text-base font-bold rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isVerifying ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>
      </form>

      {/* Resend section */}
      <div className="text-center mt-6">
        {countdown > 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">
            Didn't receive code? Resend in{" "}
            <span className="font-bold text-aptech-charcoal">
              0:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-aptech-primary font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 hover:underline cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending new OTP...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Resend OTP Code</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
