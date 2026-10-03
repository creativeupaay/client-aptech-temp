import React from "react";
import { Check } from "lucide-react";

interface KycUpgradedSuccessModalProps {
  isOpen: boolean;
  newLimit?: number;
  onBackToDashboard: () => void;
}

export const KycUpgradedSuccessModal: React.FC<KycUpgradedSuccessModalProps> = ({
  isOpen,
  newLimit = 200000,
  onBackToDashboard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-[440px] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center border border-gray-100 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Orange Checkmark Circle */}
        <div className="w-18 h-18 rounded-full bg-[#FFF4ED] border-4 border-[#FED7AA] flex items-center justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#DB6516] flex items-center justify-center shadow-sm">
            <Check className="w-7 h-7 text-white stroke-[2.8]" />
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-2xl font-bold text-[#1C1C21] tracking-tight">
          Card Limit Upgraded!
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-[320px]">
          Congratulations! Your Full KYC has been verified successfully.
        </p>

        {/* Limit Highlight Box */}
        <div className="my-7 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Your new card limit
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#DB6516] tracking-tight">
            ₹{newLimit.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full h-12 bg-white hover:bg-gray-50 text-[#DB6516] border border-[#DB6516] font-bold rounded-xl transition active:scale-[0.99] cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
