import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useGetMeQuery } from "../auth/authApi";
import { useGetCardQuery, useLoadMoneyMutation } from "./cardApi";
import {
  UpiPaymentSelector,
  type PaymentMethodType,
} from "./components/UpiPaymentSelector";
import { MoneyAddedSuccessModal } from "./components/MoneyAddedSuccessModal";

const ALL_PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export const LoadMoneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: meData } = useGetMeQuery();
  const { data: cardData } = useGetCardQuery();
  const [loadMoneyMutation, { isLoading: isPaying }] = useLoadMoneyMutation();

  const user = meData?.data?.user;
  const studentName = user?.name || "Aarav Sharma";
  const studentId = user?.studentId || "APT-2026-00417";
  const initials =
    studentName
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AS";

  const card = cardData?.data?.card;
  const cardBalance = card?.availableBalance ?? 0;
  const perLoadMax = card?.kycStatus === "FULL_KYC" ? 200000 : 10000;
  const presetAmounts = useMemo(
    () => ALL_PRESET_AMOUNTS.filter((a) => a <= perLoadMax),
    [perLoadMax]
  );

  // Stable idempotency key for retries until success (LOD-09)
  const idempotencyKeyRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `load_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );

  // Selected state
  const [amount, setAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodType>("Google Pay");
  const [customUpiId, setCustomUpiId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success modal state
  const [successReceipt, setSuccessReceipt] = useState<{
    amount: number;
    paymentMethod: string;
    transactionId: string;
    newBalance: number;
  } | null>(null);

  const handlePay = async () => {
    setErrorMessage(null);
    if (amount > perLoadMax) {
      setErrorMessage(
        `Maximum load amount is ₹${perLoadMax.toLocaleString("en-IN")} for your KYC level.`
      );
      return;
    }
    try {
      const chosenMethod =
        paymentMethod === "Custom UPI"
          ? customUpiId
            ? `UPI (${customUpiId})`
            : "UPI ID"
          : `${paymentMethod} (UPI)`;

      const response = await loadMoneyMutation({
        amount,
        paymentMethod: chosenMethod,
        upiId: customUpiId || undefined,
        idempotencyKey: idempotencyKeyRef.current,
      }).unwrap();

      // Rotate key after success so a new load is a new logical operation
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `load_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      setSuccessReceipt({
        amount: response.data.amount,
        paymentMethod: response.data.paymentMethod,
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
      });
    } catch (err: unknown) {
      interface ErrData {
        data?: { message?: string };
        message?: string;
        error?: string;
      }
      const errObj = err as ErrData;
      setErrorMessage(
        errObj?.data?.message ||
          errObj?.message ||
          errObj?.error ||
          "Payment processing failed. Please verify your balance and retry."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-gray-200/80 px-4 sm:px-8 h-18 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
              Welcome, {studentName}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Student ID: {studentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-amber-500 fill-amber-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#DB6516] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Left Column: Load Money to Your Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C1C21] tracking-tight">
                Load Money to Your Card
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Add funds to your prepaid student card using UPI
              </p>

              <div className="mt-6">
                <span className="text-xs font-medium text-gray-500">
                  Card balance: ₹{cardBalance.toLocaleString("en-IN")}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1C1C21] tracking-tight mt-1 mb-5">
                  ₹{amount.toLocaleString("en-IN")}
                </div>

                {/* Amount preset pills */}
                <div className="flex flex-wrap gap-2.5">
                  {presetAmounts.map((amt) => {
                    const isSelected = amount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`h-9 px-4 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#DB6516] text-white shadow-xs"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 text-xs text-gray-400">
              Maximum monthly load limit: ₹
              {(card?.totalLimit ?? 10000).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Right Column: Select Payment Method */}
          <div className="h-full">
            <UpiPaymentSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
              customUpiId={customUpiId}
              onChangeCustomUpiId={setCustomUpiId}
              totalAmount={amount}
              onPay={handlePay}
              isLoading={isPaying}
            />
          </div>
        </div>
      </main>

      {/* Success Receipt Modal */}
      {successReceipt && (
        <MoneyAddedSuccessModal
          isOpen={Boolean(successReceipt)}
          amount={successReceipt.amount}
          paymentMethod={successReceipt.paymentMethod}
          transactionId={successReceipt.transactionId}
          newBalance={successReceipt.newBalance}
          onCardManagement={() => {
            setSuccessReceipt(null);
            navigate("/dashboard");
          }}
          onBackToDashboard={() => {
            setSuccessReceipt(null);
            navigate("/dashboard");
          }}
        />
      )}
    </div>
  );
};
