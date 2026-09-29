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
    <div className="flex flex-col">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        HELP & SUPPORT
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card Support */}
        <div className="rounded-xl border border-orange-200/80 bg-[#FFF7ED] p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            <span className="font-semibold text-gray-900">Card Support</span> —
            Get help with card requirements, PIN issues, or recent
            transactions.
          </p>
          <button
            type="button"
            onClick={onContactCardSupport}
            className="bg-[#D85A14] hover:bg-[#be4c0d] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition active:scale-[0.98] shadow-2xs"
          >
            Contact Us
          </button>
        </div>

        {/* Loyalty Support */}
        <div className="rounded-xl border border-orange-200/80 bg-[#FFF7ED] p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            <span className="font-semibold text-gray-900">Loyalty Support</span>{" "}
            — Get help with points, rewards, or redemption issues.
          </p>
          <button
            type="button"
            onClick={onContactLoyaltySupport}
            className="bg-[#D85A14] hover:bg-[#be4c0d] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition active:scale-[0.98] shadow-2xs"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
};
