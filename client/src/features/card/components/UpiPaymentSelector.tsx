import React from "react";
import { Link2, Loader2 } from "lucide-react";

export type PaymentMethodType =
  | "Google Pay"
  | "PhonePe"
  | "Paytm"
  | "BHIM UPI"
  | "Custom UPI";

interface UpiPaymentSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  customUpiId: string;
  onChangeCustomUpiId: (val: string) => void;
  totalAmount: number;
  onPay: () => void;
  isLoading?: boolean;
}

const GooglePayIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const PhonePeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="12" fill="#5F259F" />
    <path
      d="M15.5 8.5H12.8C12.8 7.8 12.5 7.2 12 7.2H10.5C9.7 7.2 9 7.9 9 8.7V17H11.2V13.8H12.8C14.3 13.8 15.5 12.6 15.5 11.1V8.5ZM13.3 11.6H11.2V9.4H13.3V11.6Z"
      fill="white"
    />
  </svg>
);

const PaytmIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#002E6E" />
    <path
      d="M5.5 14.5L7.2 8H8.8L7.1 14.5H5.5ZM10.5 8H13.5V9.4H12.7V14.5H11.1V9.4H10.5V8ZM14.8 14.5L16.2 8H17.8L19.2 14.5H17.6L17 11.5H15.5L14.9 14.5H14.8Z"
      fill="#00BAF2"
    />
  </svg>
);

const BhimUpiIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#F8FAFC" />
    <path d="M12 4L4 12H10V20L18 12H12V4Z" fill="#0284C7" />
    <path d="M12 4L7 9H11V15L15 11H12V4Z" fill="#DB6516" />
  </svg>
);

export const UpiPaymentSelector: React.FC<UpiPaymentSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  customUpiId,
  onChangeCustomUpiId,
  totalAmount,
  onPay,
  isLoading = false,
}) => {
  const options = [
    { id: "Google Pay" as const, name: "Google Pay", icon: <GooglePayIcon /> },
    { id: "PhonePe" as const, name: "PhonePe", icon: <PhonePeIcon /> },
    { id: "Paytm" as const, name: "Paytm", icon: <PaytmIcon /> },
    { id: "BHIM UPI" as const, name: "BHIM UPI", icon: <BhimUpiIcon /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-sm flex flex-col justify-between w-full h-full">
      <div>
        <h3 className="text-base font-bold text-[#1C1C21] mb-4">
          Select Payment Method
        </h3>

        {/* Radio Option List */}
        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = selectedMethod === opt.id;
            return (
              <label
                key={opt.id}
                onClick={() => onSelectMethod(opt.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#DB6516] bg-[#FFF8F3]"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {opt.icon}
                  </div>
                  <span className="font-semibold text-sm text-gray-900">
                    {opt.name}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "border-[#DB6516]" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#DB6516]" />
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {/* Custom UPI Field */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Or enter UPI ID
          </label>
          <div
            onClick={() => onSelectMethod("Custom UPI")}
            className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-xl bg-white transition-all ${
              selectedMethod === "Custom UPI"
                ? "border-[#DB6516] ring-1 ring-[#DB6516]"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={customUpiId}
              onChange={(e) => {
                onSelectMethod("Custom UPI");
                onChangeCustomUpiId(e.target.value);
              }}
              placeholder="yourname@upi"
              className="w-full text-sm outline-hidden text-gray-800 placeholder-gray-400 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bottom Summary & Pay CTA */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 font-medium">Total</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">
            ₹{totalAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <button
          type="button"
          onClick={onPay}
          disabled={isLoading || totalAmount < 100}
          className="w-full h-12 bg-[#DB6516] hover:bg-[#C05510] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <span>Pay ₹{totalAmount.toLocaleString("en-IN")}</span>
          )}
        </button>
      </div>
    </div>
  );
};
