import React from "react";

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
    <div className="flex flex-col gap-2.5">
      {/* Limits & Usage Bar Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-[#D85A14]">
            Used: ₹{usedAmount}
          </span>
          <span className="font-bold text-gray-800 tracking-wider uppercase text-[11px]">
            TOTAL LIMIT: ₹{totalLimit.toLocaleString("en-IN")}
          </span>
          <span className="font-bold text-emerald-600">
            Available: ₹{availableBalance.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Progress Bar: Slim orange used track + teal/cyan available track */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
          <div
            className="bg-[#D85A14] h-full transition-all duration-300"
            style={{ width: `${usedPercent}%` }}
          />
          <div
            className="bg-[#059669] h-full transition-all duration-300"
            style={{ width: `${100 - usedPercent}%` }}
          />
        </div>
      </div>

      {/* Add Funds to Wallet Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[#D85A14]">
            Add funds to your wallet
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Available Balance: ₹{availableBalance.toLocaleString("en-IN")}
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadMoney}
          className="bg-[#D85A14] hover:bg-[#be4c0d] text-white text-xs font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition active:scale-[0.98] shadow-2xs"
        >
          Load Money
        </button>
      </div>
    </div>
  );
};
