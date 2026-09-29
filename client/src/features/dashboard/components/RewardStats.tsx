import React from "react";
import { ArrowRight } from "lucide-react";

interface RewardStatsProps {
  cashback?: number;
  loyaltyPoints?: number;
  onRedeemVouchers?: () => void;
}

export const RewardStats: React.FC<RewardStatsProps> = ({
  cashback = 42,
  loyaltyPoints = 315,
  onRedeemVouchers,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {/* Cashback */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs flex flex-col justify-center">
        <span className="text-xs text-gray-700 font-semibold block">
          Cashback
        </span>
        <p className="text-lg font-bold text-[#D85A14] mt-0.5">
          +₹{cashback}
        </p>
      </div>

      {/* Loyalty Points */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs flex flex-col justify-center">
        <span className="text-xs text-gray-700 font-semibold block">
          Loyalty Points
        </span>
        <p className="text-lg font-bold text-[#D85A14] mt-0.5">
          {loyaltyPoints}
        </p>
      </div>

      {/* Redeem Vouchers CTA */}
      <button
        type="button"
        onClick={onRedeemVouchers}
        className="bg-white hover:bg-orange-50/30 rounded-xl border border-gray-200 p-3 shadow-2xs flex items-center justify-between group cursor-pointer transition text-left"
      >
        <span className="text-xs sm:text-sm font-bold text-[#D85A14]">
          Redeem Vouchers
        </span>
        <ArrowRight
          size={16}
          className="text-[#D85A14] transition-transform group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
};
