import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, ArrowLeft, RefreshCw, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useExchangeSsoCodeMutation } from "./authApi";
import { aptechLogo } from "../../assets/dashboard";

export const SSOCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [exchangeSsoCode] = useExchangeSsoCodeMutation();
  const [status, setStatus] = useState<"processing" | "success" | "error">(() =>
    !code ? "error" : "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    !code
      ? "No authorization code provided in the redirect URL. Please initiate the journey from ProConnect."
      : null
  );
  const [studentName, setStudentName] = useState<string | null>(null);

  // Prevent double-execution in React Strict Mode
  const executedRef = useRef(false);

  useEffect(() => {
    if (!code || executedRef.current) return;
    executedRef.current = true;

    const performExchange = async () => {
      try {
        const response = await exchangeSsoCode({ code }).unwrap();
        setStudentName(response.data.user.name);
        setStatus("success");

        if (response.data.token) {
          localStorage.setItem("tbx_auth_token", response.data.token);
          localStorage.setItem("tbx_student_user", JSON.stringify(response.data.user));
        }

        // Brief delay for user feedback, then transition to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      } catch (err: unknown) {
        interface ApiErrorResponse {
          data?: { message?: string };
          message?: string;
        }
        const apiErr = err as ApiErrorResponse;
        const msg = apiErr?.data?.message || apiErr?.message || "Failed to authenticate with ProConnect. The authorization code may be invalid or expired.";
        setStatus("error");
        setErrorMessage(msg);
      }
    };

    performExchange();
  }, [code, exchangeSsoCode, navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFFDF8] via-[#FAF3E8] to-[#F5ECE0] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-orange-100 p-8 sm:p-10 relative overflow-hidden animate-fade-in text-center">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-orange-200/30 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Logo Header */}
        <div className="flex justify-center mb-6">
          <img
            src={aptechLogo}
            alt="Aptech"
            className="h-10 sm:h-12 object-contain"
          />
        </div>

        {/* Status: Processing */}
        {status === "processing" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-[#D85A14]">
                <Loader2 size={32} className="animate-spin text-[#D85A14]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                <ShieldCheck size={14} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Authenticating with ProConnect
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Securely verifying your student authorization code and establishing your session...
              </p>
            </div>

            {/* Zero-PII Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold mt-2">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Backchannel Single-Use Code Exchange</span>
            </div>
          </div>
        )}

        {/* Status: Success */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Welcome, {studentName || "Student"}!
              </h2>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                ProConnect SSO verification complete.
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Redirecting you to your Card Dashboard...
              </p>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div className="bg-[#D85A14] h-full w-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Status: Error */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-600 shadow-sm">
              <AlertCircle size={34} />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                SSO Verification Failed
              </h2>
              <p className="text-xs text-red-600 font-medium mt-2 p-3 bg-red-50/80 rounded-xl border border-red-100 leading-relaxed text-left">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Return to Login</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#D85A14] hover:bg-[#be4c0d] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
