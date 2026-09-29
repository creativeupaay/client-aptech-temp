import React from "react";
import { kycBannerBg } from "../../../assets/dashboard";

interface KycBannerProps {
  onCompleteKyc?: () => void;
}

/** Biometric / ID Verification Badge SVG matching the Figma KYC icon */
const KycVerificationIcon: React.FC = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {/* Corner scan brackets */}
    <path
      d="M5 8V6C5 5.44772 5.44772 5 6 5H8"
      stroke="#DB6516"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M20 5H22C22.5523 5 23 5.44772 23 6V8"
      stroke="#DB6516"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M5 20V22C5 22.5523 5.44772 23 6 23H8"
      stroke="#DB6516"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M20 23H22C22.5523 23 23 22.5523 23 22V20"
      stroke="#DB6516"
      strokeWidth="1.75"
      strokeLinecap="round"
    />

    {/* Hat / Visor */}
    <ellipse cx="14" cy="9.5" rx="5.5" ry="1.5" fill="#DB6516" />
    <path
      d="M10.5 9.5C10.5 7.5 12 6 14 6C16 6 17.5 7.5 17.5 9.5"
      fill="#DB6516"
    />

    {/* Face Silhouette */}
    <circle cx="14" cy="12.5" r="2.5" fill="#DB6516" />

    {/* Shoulders */}
    <path
      d="M9 20C9 17.5 11 16 14 16C15.3 16 16.4 16.4 17.2 17.1"
      stroke="#DB6516"
      strokeWidth="1.75"
      strokeLinecap="round"
    />

    {/* Verification Checkmark Badge */}
    <circle cx="20" cy="19.5" r="3.75" fill="#DB6516" />
    <path
      d="M18.5 19.5L19.5 20.5L21.5 18.5"
      stroke="white"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const KycBanner: React.FC<KycBannerProps> = ({ onCompleteKyc }) => {
  return (
    <div
      className="relative rounded-[12px] overflow-hidden p-[16px] flex items-center justify-between gap-[20px] text-white select-none w-full max-w-[560px] h-[92px]"
      style={{
        width: "100%",
        maxWidth: "560px",
        height: "92px",
        borderRadius: "12px",
        padding: "16px",
        gap: "20px",
        opacity: 1,
        backgroundImage: `url(${kycBannerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0px 8px 20px 0px #DB651626",
      }}
    >
      {/* Left content: Badge + Text */}
      <div className="relative z-10 flex items-center gap-3 min-w-0">
        {/* Verification Icon Badge */}
        <div className="w-[50px] h-[50px] sm:w-[52px] sm:h-[52px] rounded-[10px] bg-white/95 shadow-xs flex items-center justify-center shrink-0">
          <KycVerificationIcon />
        </div>

        {/* Text Details */}
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight truncate sm:whitespace-normal">
            Increase your card limit to ₹2 lakh
          </h3>
          <p className="text-xs text-white/95 font-medium mt-1 leading-tight truncate sm:whitespace-normal">
            Complete Full KYC to unlock a higher limit
          </p>
        </div>
      </div>

      {/* Right action button */}
      <div className="relative z-10 shrink-0">
        <button
          type="button"
          onClick={onCompleteKyc}
          className="bg-white hover:bg-white/95 active:scale-[0.98] text-[#DB6516] font-bold text-xs sm:text-sm px-4 sm:px-5 h-[40px] rounded-[10px] shadow-xs transition cursor-pointer whitespace-nowrap flex items-center justify-center"
        >
          Complete Full KYC
        </button>
      </div>
    </div>
  );
};

