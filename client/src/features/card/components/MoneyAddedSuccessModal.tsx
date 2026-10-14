import React from "react";
import { Check } from "lucide-react";

interface MoneyAddedSuccessModalProps {
  isOpen: boolean;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  newBalance: number;
  onCardManagement: () => void;
  onBackToDashboard: () => void;
}

export const MoneyAddedSuccessModal: React.FC<MoneyAddedSuccessModalProps> = ({
  isOpen,
  amount,
  paymentMethod,
  transactionId,
  newBalance,
  onCardManagement,
  onBackToDashboard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-[440px] rounded-t-3xl md:rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center border border-gray-100 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Green Checkmark Circle */}
        <div className="w-18 h-18 rounded-full bg-[#E6F8F0] border-4 border-[#C8F1E0] flex items-center justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center shadow-sm">
            <Check className="w-7 h-7 text-white stroke-[2.8]" />
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-2xl font-bold text-[#1C1C21] tracking-tight">
          Money Added Successfully!
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">
          ₹{amount.toLocaleString("en-IN")} has been credited to your student card.
        </p>

        {/* Transaction Details Box */}
        <div className="w-full bg-[#FAF9F7] border border-[#F0EFEB] rounded-2xl p-4.5 my-6 text-left space-y-3">
          <div className="text-xs font-bold text-gray-900 tracking-tight mb-2">
            Transaction Details
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600 font-medium">Amount</span>
            <span className="font-bold text-gray-900">
              ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600 font-medium">Payment method</span>
            <span className="font-semibold text-gray-800">{paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600 font-medium">Transaction ID</span>
            <span className="font-mono text-xs font-semibold text-gray-700">
              {transactionId}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm pt-1 border-t border-gray-200/60">
            <span className="text-gray-600 font-medium">New balance</span>
            <span className="font-bold text-gray-900">
              ₹{newBalance.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={onCardManagement}
            className="w-full h-12 bg-[#DB6516] hover:bg-[#C05510] text-white font-bold rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            Card Management
          </button>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full h-12 bg-white hover:bg-gray-50 text-[#DB6516] border border-[#DB6516] font-bold rounded-xl transition active:scale-[0.99] cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
