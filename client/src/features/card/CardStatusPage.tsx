import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useGetMeQuery } from "../auth/authApi";
import { useGetCardQuery, usePollCardStatusQuery } from "./cardApi";
import { aptechLogo, cardBg } from "../../assets/dashboard";

export const CardStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: meData } = useGetMeQuery();
  const { data: cardRes, isLoading: isCardLoading, refetch: refetchCard } = useGetCardQuery();

  const isAlreadyActive =
    cardRes?.data?.card?.status === "ACTIVE" ||
    cardRes?.data?.card?.status === "ISSUED" ||
    cardRes?.data?.card?.status === "FROZEN" ||
    cardRes?.data?.card?.status === "BLOCKED";

  // Automatically poll status from TransBnk (API 5) every 2s until active
  // Note: we do NOT use skip: true so pollRes is never wiped from component state
  const { data: pollRes } = usePollCardStatusQuery(undefined, {
    pollingInterval: isAlreadyActive ? 0 : 2000,
    refetchOnMountOrArgChange: true,
  });

  const user = meData?.data?.user;
  const liveCard = pollRes?.data?.card || cardRes?.data?.card;
  const studentName = user?.name || "Student";

  const isCardActive =
    liveCard?.status === "ACTIVE" ||
    liveCard?.status === "ISSUED" ||
    liveCard?.status === "FROZEN" ||
    liveCard?.status === "BLOCKED";

  const isCardPending = !isCardActive && (liveCard?.status === "APPLICATION_PENDING" || !liveCard);

  // When card transitions to active via polling, synchronize getCard cache across the app
  useEffect(() => {
    if (isCardActive && cardRes?.data?.card?.status !== "ACTIVE") {
      refetchCard();
    }
  }, [isCardActive, cardRes?.data?.card?.status, refetchCard]);

  // If card is not applied, redirect to card issuance
  useEffect(() => {
    if (!isCardLoading && cardRes && liveCard?.status === "NOT_APPLIED") {
      navigate("/card/issuance", { replace: true });
    }
  }, [isCardLoading, cardRes, liveCard?.status, navigate]);

  if (isCardLoading && !liveCard) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#DB6516] animate-spin" />
          <p className="text-sm font-medium text-gray-500">Checking card status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Confetti Decorative Accents matching reference UI */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {/* Floating confetti dots and sprinkles around the top container */}
        <div className="absolute top-[8%] left-[20%] w-2.5 h-2.5 rounded-full bg-[#E5A93C] opacity-80 animate-pulse" />
        <div className="absolute top-[12%] left-[32%] w-3 h-1.5 rounded-sm bg-[#DB6516] rotate-45 opacity-70" />
        <div className="absolute top-[6%] left-[45%] w-2 h-2 rounded-full bg-[#E5A93C] opacity-90" />
        <div className="absolute top-[14%] right-[30%] w-2.5 h-2.5 rounded-full bg-[#D97706] opacity-75" />
        <div className="absolute top-[8%] right-[18%] w-3 h-2 rounded-sm bg-[#F59E0B] -rotate-12 opacity-85" />
        <div className="absolute top-[15%] left-[16%] w-2 h-2 rounded-full bg-[#FBBF24] opacity-70" />
        <div className="absolute top-[18%] right-[22%] w-2 h-3 rounded-sm bg-[#EA580C] rotate-30 opacity-60" />
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.07)] border border-gray-100/80 relative z-10 transition-all">
        {isCardPending ? (
          /* ========================================================
             1. IN-PROGRESS / APPLICATION_PENDING STATE
             ======================================================== */
          <div className="text-center space-y-6 py-3">
            {/* Pulsing Loading Badge */}
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/60 relative">
              <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                <Loader2 className="w-7 h-7 text-white animate-spin stroke-[2.5]" />
              </div>
            </div>

            {/* Header Titles & Simple Friendly Message */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-[#1C1C21] tracking-tight">
                Activating Your Card...
              </h1>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                We are setting up your student card with the bank. This usually takes just a few seconds, please hold on.
              </p>
            </div>

            {/* Reassuring note */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl max-w-xs mx-auto">
              <p className="text-xs text-amber-800 font-medium">
                Please do not refresh or close this screen.
              </p>
            </div>
          </div>
        ) : isCardActive ? (
          /* ========================================================
             2. ACTIVE CELEBRATION STATE (MATCHING USER REFERENCE UI)
             ======================================================== */
          <div className="text-center space-y-5">
            {/* Green Circular Badge with Checkmark */}
            <div className="w-20 h-20 bg-[#E8FAF0] rounded-full flex items-center justify-center mx-auto ring-8 ring-[#F0FDF4] shadow-xs">
              <div className="w-14 h-14 bg-[#10B981] rounded-full flex items-center justify-center shadow-xs">
                <Check className="w-7 h-7 text-white stroke-[3.5]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-[26px] font-bold text-[#1C1C21] tracking-tight">
                Your Student Card is Ready!
              </h1>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                Your prepaid student card has been successfully issued.
              </p>
            </div>

            {/* Card Preview Container */}
            <div className="bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 border border-gray-100 text-left">
              <h2 className="text-xs font-bold text-gray-900 mb-3 tracking-wide">
                Card preview
              </h2>

              {/* Virtual Card Graphic */}
              <div
                className="w-full aspect-[1.586/1] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden text-white"
                style={{
                  backgroundImage: `url(${cardBg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Subtle sheen layer */}
                <div className="absolute inset-0 bg-black/5 pointer-events-none" />

                {/* Top: Aptech Brand Logo */}
                <div className="relative z-10 flex items-start justify-between">
                  <img
                    src={aptechLogo}
                    alt="Aptech"
                    className="h-7 sm:h-8 object-contain drop-shadow-xs"
                  />
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    ● Active
                  </span>
                </div>

                {/* Middle: Cardholder Name */}
                <div className="relative z-10 mt-auto mb-2">
                  <span className="text-[9px] tracking-wider text-white/85 uppercase font-semibold block">
                    CARD HOLDER NAME
                  </span>
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-xs truncate mt-0.5">
                    {studentName}
                  </p>
                </div>

                {/* Bottom: RuPay branding indicator */}
                <div className="relative z-10 flex items-center justify-between text-[11px] font-mono tracking-widest text-white/90">
                  <span>{liveCard?.maskedPan || "•••• •••• •••• 8942"}</span>
                  <span className="font-sans font-bold text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white backdrop-blur-xs">
                    RuPay
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Continue with Loading money */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/load-money")}
                className="w-full h-12 sm:h-13 bg-[#DB6516] hover:bg-[#C05510] text-white font-bold rounded-xl text-sm sm:text-base transition cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                Continue with Loading money
              </button>

              {/* Secondary Navigation Link */}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition py-1 text-center cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             3. FALLBACK / UNEXPECTED STATE
             ======================================================== */
          <div className="text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-900">Card Setup Required</h1>
            <p className="text-sm text-gray-500">
              Please apply for your prepaid student card to proceed.
            </p>
            <button
              type="button"
              onClick={() => navigate("/card/issuance")}
              className="w-full h-11 bg-[#DB6516] text-white font-bold rounded-xl transition cursor-pointer"
            >
              Go to Card Issuance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
