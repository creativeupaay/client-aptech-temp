import React from "react";

interface HelpSupportProps {
  onContactCardSupport?: () => void;
  onContactLoyaltySupport?: () => void;
}

export const HelpSupport: React.FC<HelpSupportProps> = ({
  onContactCardSupport,
  onContactLoyaltySupport,
}) => {
  return (
    <div
      className="rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between sm:h-[136px] sm:max-h-[136px] border border-[#FFD5BA80] shadow-2xs"
      style={{
        backgroundColor: "#FFD5BA33",
      }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5E55] mb-2 sm:mb-2.5">
        HELP & SUPPORT
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card Support */}
        <div
          className="rounded-xl bg-white/90 p-3 sm:p-3.5 flex items-center justify-between gap-3"
          style={{
            border: "1px solid #FFD5BA",
          }}
        >
          <p className="text-xs text-[#52525B] leading-snug">
            <span className="font-semibold text-[#1C1C21]">Card Support</span> —
            Get help with card requirements, PIN issues, or recent
            transactions.
          </p>
          <button
            type="button"
            onClick={onContactCardSupport}
            className="bg-[#DB6516] hover:bg-[#c45710] text-white text-xs font-semibold px-3.5 py-1.5 rounded-[8px] shrink-0 cursor-pointer transition active:scale-[0.98]"
          >
            Contact Us
          </button>
        </div>

        {/* Loyalty Support */}
        <div
          className="rounded-xl bg-white/90 p-3 sm:p-3.5 flex items-center justify-between gap-3"
          style={{
            border: "1px solid #FFD5BA",
          }}
        >
          <p className="text-xs text-[#52525B] leading-snug">
            <span className="font-semibold text-[#1C1C21]">Loyalty Support</span>{" "}
            — Get help with points, rewards, or redemption issues.
          </p>
          <button
            type="button"
            onClick={onContactLoyaltySupport}
            className="bg-[#DB6516] hover:bg-[#c45710] text-white text-xs font-semibold px-3.5 py-1.5 rounded-[8px] shrink-0 cursor-pointer transition active:scale-[0.98]"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
};
