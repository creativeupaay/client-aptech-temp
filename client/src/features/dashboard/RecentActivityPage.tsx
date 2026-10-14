import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { useGetCardTransactionsQuery } from "../card/cardApi";
import { useGetHubbleHistoryQuery } from "./hubbleApi";
import type { Transaction } from "./mockData";

/**
 * Full Recent Activity view (DSH-12) — card ledger + voucher redemptions.
 */
export const RecentActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: txData, isLoading: txLoading } = useGetCardTransactionsQuery();
  const { data: hubbleData, isLoading: hubbleLoading } = useGetHubbleHistoryQuery();

  const transactions: (Transaction & { rawDate: number })[] = useMemo(() => {
    const liveCardList = (txData?.data?.transactions || []).map((t) => ({
      id: t.txnId,
      title: t.title,
      date: new Date(t.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawDate: new Date(t.createdAt).getTime(),
      points: Math.floor(t.amount / 100),
      amount: t.amount,
      type: t.type as "DR" | "CR",
    }));

    const liveVoucherList = (hubbleData?.data?.vouchers || []).map((v) => ({
      id: v._id || `VOUCH-${Date.now()}`,
      title: `Voucher: ${v.brandName || "Brand Gift Card"}`,
      date: v.createdAt
        ? new Date(v.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recent",
      rawDate: v.createdAt ? new Date(v.createdAt).getTime() : 0,
      points: -(v.pointsDebited || 0),
      amount: v.denomination || 0,
      type: "DR" as const,
    }));

    return [...liveCardList, ...liveVoucherList].sort((a, b) => b.rawDate - a.rawDate);
  }, [txData, hubbleData]);

  const isLoading = txLoading || hubbleLoading;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 font-sans">
      <header className="w-full bg-white border-b border-gray-200/80 px-4 sm:px-8 h-16 flex items-center sticky top-0 z-30">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer mr-3"
          aria-label="Back to My Cards"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-[#1C1C21]">Recent Activity</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading activity...</div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400 px-6">
              No activity yet. Card loads, spends, and voucher redemptions will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C1C21] truncate">{tx.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-900">
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points} pts
                      </span>
                    </div>
                    <span
                      className={`text-xs font-extrabold min-w-[70px] text-right ${
                        tx.type === "CR" ? "text-emerald-600" : "text-[#B91C1C]"
                      }`}
                    >
                      ₹{tx.amount.toLocaleString("en-IN")} {tx.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};
