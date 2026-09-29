import React from "react";
import { Button } from "../../../components/ui";

interface CardBalanceBarProps {
  usedAmount?: number;
  totalLimit?: number;
  availableBalance?: number;
  onLoadMoney?: () => void;
}

export const CardBalanceBar: React.FC<CardBalanceBarProps> = ({
  usedAmount = 3000,
  totalLimit = 10000,
  availableBalance = 7000,
  onLoadMoney,
}) => {
  const usedPercent = Math.min(
    100,
    Math.max(0, (usedAmount / (totalLimit || 1)) * 100)
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8EB] p-4 sm:p-5 shadow-2xs w-full flex flex-col justify-between">
      {/* Top Row: Used / Total Limit / Available */}
      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
        <span className="font-bold text-[#DB6516]">
          Used: ₹{usedAmount}
        </span>
        <span className="font-bold text-[#262626] tracking-wide uppercase text-[11px] sm:text-xs">
          TOTAL LIMIT: ₹{totalLimit.toLocaleString("en-IN")}
        </span>
        <span className="font-bold text-[#10B981]">
          Available: ₹{availableBalance.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Progress Bar: Two-tone continuous bar (Used orange + Available green) */}
      <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-gray-100 mb-3.5">
        <div
          className="bg-[#DB6516] h-full transition-all duration-300"
          style={{ width: `${usedPercent}%` }}
        />
        <div
          className="bg-[#10B981] h-full transition-all duration-300"
          style={{ width: `${100 - usedPercent}%` }}
        />
      </div>

      {/* Bottom Row: Add Funds text + Load Money Button */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div>
          <h4 className="text-sm sm:text-[15px] font-bold text-[#DB6516] leading-tight">
            Add funds to your wallet
          </h4>
          <p className="text-xs text-[#737380] font-normal mt-0.5">
            Available Balance: ₹{availableBalance.toLocaleString("en-IN")}
          </p>
        </div>

        <Button
          onClick={onLoadMoney}
          className="h-[38px] sm:h-[40px] px-5 sm:px-6 text-xs sm:text-sm font-bold rounded-xl shadow-2xs whitespace-nowrap"
        >
          Load Money
        </Button>
      </div>
    </div>
  );
};

