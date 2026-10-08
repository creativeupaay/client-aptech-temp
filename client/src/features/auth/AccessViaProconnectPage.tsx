import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSimulateSsoCodeMutation, useGetMeQuery } from "./authApi";
import {
  CreditCard,
  Gift,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

export const AccessViaProconnectPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulateSsoCode, { isLoading: isSimulating }] = useSimulateSsoCodeMutation();
  const [demoError, setDemoError] = useState<string | null>(null);

  // If already authenticated, allow direct navigation to dashboard
  const token = localStorage.getItem("tbx_auth_token");
  const { data: meData } = useGetMeQuery(undefined, { skip: !token });
  const isAuthenticated = Boolean(token && meData?.data?.user);
  const proconnectUrl = import.meta.env.VITE_PROCONNECT_URL || "http://localhost:5175";

  const handleLaunchDemoSso = async () => {
    setDemoError(null);
    try {
      const res = await simulateSsoCode({
        studentId: "APT-2026-00417",
        name: "Rohan Verma",
        mobile: "9306700469",
        email: "rohan.verma@aptech.ac.in",
      }).unwrap();

      if (res?.data?.code) {
        navigate(`/sso/callback?code=${res.data.code}`);
      } else {
        throw new Error("Missing authorization code in response.");
      }
    } catch (err) {
      console.error("Demo SSO launch failed:", err);
      setDemoError("Unable to initialize demo SSO code. Please verify server connection.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBFBFC] via-[#F4F5F7] to-[#EDEDF2] text-gray-900 flex flex-col justify-between selection:bg-[#D85A14]/20 selection:text-[#D85A14]">
      {/* Top Header */}
      <header className="w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D85A14] to-[#B34509] flex items-center justify-center text-white shadow-sm shadow-[#D85A14]/30 font-bold text-sm tracking-tight">
              AP
            </div>
            <div>
              <span className="font-extrabold text-gray-900 tracking-tight text-base sm:text-lg">
                AP-Tech
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#D85A14] ml-2 px-1.5 py-0.5 bg-[#D85A14]/10 rounded-md">
                Card & Rewards
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">SSO Authentication Gateway</span>
            <span className="sm:hidden">SSO Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 flex flex-col items-center justify-center">
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/70 text-[#D85A14] text-xs font-semibold mb-6 shadow-xs">
          <Lock size={12} className="text-[#D85A14]" />
          <span>Aptech Student Portal Single Sign-On</span>
        </div>

        {/* Hero Title & Description */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 text-center tracking-tight max-w-3xl leading-[1.15]">
          Access Your Prepaid Card & Rewards via{" "}
          <span className="bg-gradient-to-r from-[#D85A14] via-[#F26A1B] to-[#B34509] bg-clip-text text-transparent">
            Aptech ProConnect
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-gray-600 text-center max-w-2xl leading-relaxed">
          The AP-Tech Student Card, digital wallet controls, and Hubble loyalty points marketplace are
          accessible exclusively for enrolled Aptech students directly through the official student portal.
        </p>

        {/* Active Session Quick Jump */}
        {isAuthenticated && (
          <div className="mt-6 w-full max-w-md p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900">Active session detected</p>
                <p className="text-[11px] text-gray-500">{meData?.data?.user?.name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Action Panel Card */}
        <div className="mt-8 w-full max-w-xl bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-100/50 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#D85A14]/10 text-[#D85A14] flex items-center justify-center font-bold">
              <GraduationCap size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Enrolled Aptech Student?
              </h2>
              <p className="text-xs text-gray-500">
                Log in to ProConnect and select &quot;Apply Card&quot; or &quot;My Cards&quot;.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Primary Action: Go to ProConnect Portal */}
            <a
              href={proconnectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-2xl bg-[#D85A14] hover:bg-[#be4c0d] text-white font-bold text-sm shadow-md shadow-[#D85A14]/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer"
            >
              <span>Launch Aptech ProConnect</span>
              <ExternalLink size={16} />
            </a>

            {/* Developer / Demo Sandbox Launcher */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Developer &amp; Testing Mode
                </span>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Instant SSO Simulation
                </span>
              </div>

              <button
                type="button"
                onClick={handleLaunchDemoSso}
                disabled={isSimulating}
                className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#D85A14] bg-gray-50/70 hover:bg-orange-50/40 text-gray-700 hover:text-[#D85A14] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isSimulating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-[#D85A14]" />
                    <span>Minting ProConnect Authorization Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-[#D85A14]" />
                    <span>One-Click Demo Student SSO (APT-2026-00417)</span>
                  </>
                )}
              </button>

              {demoError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2 text-left">
                  <AlertCircle size={14} className="shrink-0 text-red-500" />
                  <span>{demoError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D85A14] flex items-center justify-center mb-3">
              <CreditCard size={18} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">RuPay Prepaid Card</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Virtual GPR reloadable card powered by TransBnk with instant fund loading and in-app controls.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Gift size={18} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Hubble Rewards</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Redeem academic Aptech Loyalty Coins for 500+ brand gift vouchers with real-time balance sync.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col items-start text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Zero-PII Security</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Single-use authorization code handshake with ProConnect. No manual credentials or plain passwords.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white/60 py-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Aptech Limited. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>PCI-DSS Compliant</span>
            <span>•</span>
            <span>TransBnk Regulated Partner</span>
            <span>•</span>
            <span>Hubble Money Marketplace</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
