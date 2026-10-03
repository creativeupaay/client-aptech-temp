import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Globe,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useGetMeQuery } from "../auth/authApi";
import {
  useGetCardQuery,
  useGetFullKycUrlMutation,
  useCheckKycStatusQuery,
  useCompleteFullKycMutation,
} from "./cardApi";
import { KycUpgradedSuccessModal } from "./components/KycUpgradedSuccessModal";

export const KycVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: meData } = useGetMeQuery();
  const { data: cardRes } = useGetCardQuery();
  const { data: kycStatusData, refetch: refetchKycStatus } = useCheckKycStatusQuery();

  const [getFullKycUrlMutation, { isLoading: isGeneratingUrl }] = useGetFullKycUrlMutation();
  const [completeFullKycMutation, { isLoading: isUpgradingFastTrack }] = useCompleteFullKycMutation();

  const user = meData?.data?.user;
  const card = cardRes?.data?.card;
  const isAlreadyFullKyc =
    card?.kycStatus === "FULL_KYC" || kycStatusData?.data?.kycStatus === "FULL_KYC";

  const studentName = user?.name || "Aarav Sharma";
  const studentId = user?.studentId || "APT-2026-00417";
  const initials =
    studentName
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AS";

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sandboxSessionUrl, setSandboxSessionUrl] = useState<string | null>(null);
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  // If user returned from external e-KYC portal with ?kyc_callback=true or ?status=success
  useEffect(() => {
    const isCallback = searchParams.get("kyc_callback") === "true" || searchParams.get("status") === "success";
    if (isCallback && !isAlreadyFullKyc) {
      refetchKycStatus().then((res) => {
        if (res.data?.data?.isCompleted) {
          setShowSuccessModal(true);
        }
      });
    }
  }, [searchParams, isAlreadyFullKyc, refetchKycStatus]);

  // Handle launch of official e-KYC portal
  const handleLaunchKycPortal = async () => {
    setErrorMessage(null);
    try {
      const res = await getFullKycUrlMutation().unwrap();
      const targetUrl = res.data.url;

      if (!targetUrl) {
        // KYC already complete
        refetchKycStatus();
        return;
      }

      setSandboxSessionUrl(targetUrl);
      setIsSandboxModalOpen(true);
    } catch (err: unknown) {
      interface ErrData {
        data?: { message?: string };
      }
      setErrorMessage(
        (err as ErrData)?.data?.message || "Failed to generate secure Full KYC session URL."
      );
    }
  };

  // Simulate completion inside sandbox modal (or fallback fast-track)
  const handleSandboxSimulateSuccess = async () => {
    try {
      await completeFullKycMutation({
        aadhaarNumber: "123456789012",
        aadhaarOtp: "123456",
        panNumber: "ABCDE1234F",
      }).unwrap();
      setIsSandboxModalOpen(false);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      interface ErrData {
        data?: { message?: string };
      }
      setErrorMessage((err as ErrData)?.data?.message || "Sandbox verification failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-gray-200/80 px-4 sm:px-8 h-18 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              Welcome, {studentName}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Student ID: {studentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-amber-500 fill-amber-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#DB6516] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col items-center">
        {isAlreadyFullKyc ? (
          /* Already Full KYC State */
          <div className="w-full max-w-[620px] bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-10 shadow-xs text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Full KYC Verified
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Enhanced ₹2,00,000 Limit Unlocked!
              </h2>
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              Your identity has been fully verified via UIDAI Aadhaar e-KYC and NSDL PAN matching. Your AP-Tech RuPay Prepaid Card has lifetime validity and highest permissible load limit.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-8 h-12 bg-[#DB6516] hover:bg-[#C05510] text-white font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* KYC Upgrade Gateway */
          <div className="w-full space-y-6">
            {/* Hero Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
                <span>Instant 2-Minute Digital Verification</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Upgrade to Full KYC
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                RBI-mandated paperless e-KYC conducted via regulated banking partner <strong>Oxymoney / TransBnk</strong>. Elevate your spending freedom from ₹10,000 to ₹2,00,000.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Comparison Cards: Min KYC vs Full KYC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Min KYC (Current) */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Tier</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    Min KYC
                  </span>
                </div>
                <div className="text-2xl font-black text-gray-900">₹10,000</div>
                <p className="text-xs text-gray-500 mt-0.5">Maximum monthly reload capacity</p>
                <ul className="mt-4 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Basic domestic merchant POS and online payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>12-month provisional regulatory validity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Restricted wallet outbound transfer</span>
                  </li>
                </ul>
              </div>

              {/* Full KYC (Enhanced) */}
              <div className="bg-gradient-to-br from-orange-50/70 to-white rounded-2xl border-2 border-[#DB6516] p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#DB6516] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Recommended
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#DB6516] uppercase tracking-wider">Enhanced Tier</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                    Full KYC
                  </span>
                </div>
                <div className="text-2xl font-black text-gray-900">₹2,00,000</div>
                <p className="text-xs text-gray-500 mt-0.5">Maximum permissible balance limit</p>
                <ul className="mt-4 space-y-2 text-xs text-gray-700 border-t border-orange-100 pt-4 font-medium">
                  <li className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pay complete semester course fees without limits</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent lifetime card instrument validity</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Unrestricted RuPay GPR spend across all merchants</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Official e-KYC Launch Section */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#DB6516] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    UIDAI Aadhaar & NSDL PAN Verification Gate
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Per RBI Reserve Bank of India PPI Master Directions, Full KYC must be completed via regulated partner Oxymoney. You will be redirected to an authenticated session to verify your Aadhaar OTP and PAN.
                  </p>
                </div>
              </div>

              {/* 3 Step Verification Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#DB6516]" /> 1. Aadhaar OTP
                  </div>
                  <p className="text-gray-500 text-[11.5px]">Official OTP sent directly to UIDAI registered mobile</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#DB6516]" /> 2. PAN Match
                  </div>
                  <p className="text-gray-500 text-[11.5px]">Instant NSDL name and tax identifier verification</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#DB6516]" /> 3. Live Liveness
                  </div>
                  <p className="text-gray-500 text-[11.5px]">Quick 3-second biometric selfie liveness check</p>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleLaunchKycPortal}
                  disabled={isGeneratingUrl}
                  className="w-full h-12 bg-[#DB6516] hover:bg-[#C05510] text-white font-bold rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {isGeneratingUrl ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating Secure e-KYC Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Oxymoney e-KYC Portal</span>
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Developer Sandbox Fast-Track Option */}
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sandbox Environment Active</span>
                </span>
                <button
                  type="button"
                  onClick={handleSandboxSimulateSuccess}
                  disabled={isUpgradingFastTrack}
                  className="text-[#DB6516] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isUpgradingFastTrack ? "Simulating..." : "Fast-Track Verify (Sandbox)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sandbox Oxymoney Gateway Modal */}
      {isSandboxModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
        >
          <div
            className="w-full max-w-[500px] bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-[#DB6516] flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Oxymoney e-KYC Verification Portal
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                You are about to be redirected to the regulated banking gateway session:
              </p>
              <div className="p-2.5 rounded-lg bg-gray-50 font-mono text-[11px] text-gray-600 break-all border border-gray-200">
                {sandboxSessionUrl}
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleSandboxSimulateSuccess}
                disabled={isUpgradingFastTrack}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpgradingFastTrack ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate Successful Portal Verification</span>
                  </>
                )}
              </button>
              {sandboxSessionUrl && (
                <a
                  href={sandboxSessionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Real URL in New Tab</span>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsSandboxModalOpen(false)}
                className="w-full h-9 text-xs text-gray-500 hover:text-gray-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Limit Celebration Modal */}
      <KycUpgradedSuccessModal
        isOpen={showSuccessModal}
        newLimit={200000}
        onBackToDashboard={() => {
          setShowSuccessModal(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
};
