import React from "react";
import { UserCheck } from "lucide-react";
import { kycBannerBg } from "../../../assets/dashboard";

interface KycBannerProps {
  onCompleteKyc?: () => void;
}

export const KycBanner: React.FC<KycBannerProps> = ({ onCompleteKyc }) => {
  return (
    <div
      className="relative rounded-2xl overflow-hidden px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs flex items-center justify-between gap-3 text-white"
      style={{
        backgroundImage: `url(${kycBannerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left content: Badge + Text */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border border-white/40 flex items-center justify-center shrink-0 shadow-xs">
          <UserCheck size={20} className="text-white drop-shadow-xs" />
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight drop-shadow-xs">
            Increase your card limit to ₹2 lakh
          </h3>
          <p className="text-[11px] text-white/90 font-medium mt-0.5 drop-shadow-xs">
            Complete Full KYC to unlock a higher limit
          </p>
        </div>
      </div>

      {/* Right action button */}
      <div className="relative z-10 shrink-0">
        <button
          type="button"
          onClick={onCompleteKyc}
          className="bg-white hover:bg-orange-50 text-[#D85A14] font-bold text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-xs transition cursor-pointer whitespace-nowrap active:scale-[0.98]"
        >
          Complete Full KYC
        </button>
      </div>
    </div>
  );
};
