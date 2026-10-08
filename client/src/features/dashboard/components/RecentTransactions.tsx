import React from "react";
import { Star, RefreshCw } from "lucide-react";
import type { Transaction } from "../mockData";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            RECENT TRANSACTIONS
          </h3>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh activity"
              aria-label="Refresh activity"
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={isRefreshing ? "animate-spin text-[#D85A14]" : ""}
              />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#D85A14] hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Scrollable list with scrollbar matching Figma */}
      <div className="flex flex-col divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-medium">
            No transactions recorded yet. Activity will appear here once you use your RuPay card or redeem vouchers.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
            >
              {/* Left: Title & Date */}
              <div>
                <p className="text-xs font-bold text-gray-900 leading-snug">
                  {tx.title}
                </p>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  {tx.date}
                </span>
              </div>

              {/* Right: Points + Amount */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Points badge */}
                <div className="flex items-center gap-1">
                  <Star
                    size={12}
                    className="fill-amber-400 text-amber-400"
                  />
                  <span className="text-xs font-bold text-gray-900">
                    +{tx.points} pts
                  </span>
                </div>

                {/* Amount badge */}
                <span
                  className={`text-xs font-extrabold min-w-[70px] text-right ${
                    tx.type === "CR" ? "text-emerald-600" : "text-[#B91C1C]"
                  }`}
                >
                  ₹{tx.amount.toLocaleString("en-IN")} {tx.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
