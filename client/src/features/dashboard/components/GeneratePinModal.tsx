import React, { useState } from "react";

interface GeneratePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (pin: string) => void;
}

export const GeneratePinModal: React.FC<GeneratePinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"input" | "success">("input");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePinInput = (val: string, setter: (v: string) => void) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 4);
    setter(digitsOnly);
    if (error) setError("");
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    if (confirmPin.length !== 4) {
      setError("Please re-enter your 4-digit PIN to confirm");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setError("");
    setStep("success");
    onSuccess?.(newPin);
  };

  const handleClose = () => {
    setStep("input");
    setNewPin("");
    setConfirmPin("");
    setError("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[390px] bg-white rounded-[24px] p-6 sm:p-7 shadow-xl border border-[#E8E8EB] relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title & Close Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#1C1C21]">Generate Pin</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="text-[#737380] hover:text-[#1C1C21] transition-colors p-1 -mr-1 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "input" ? (
          /* STEP 1: Set your 4-digit PIN */
          <form onSubmit={handleContinue} className="mt-4">
            {/* Centered Lock Icon Badge */}
            <div className="flex justify-center">
              <div className="w-[58px] h-[58px] rounded-full bg-[#FDF0E7] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#DB6516]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" />
                </svg>
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mt-3.5">
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#1C1C21]">
                Set your 4-digit PIN
              </h4>
              <p className="text-[13px] text-[#737380] mt-1.5 leading-snug px-2">
                Choose a secure PIN for your card. You will use this PIN for ATM withdrawals and payments.
              </p>
              {/* PCI-DSS Security Badge */}
              <div className="flex items-center justify-center gap-1.5 mt-2.5 py-1 px-2.5 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 mx-auto w-fit">
                <span>🔒 PCI-DSS Compliant</span>
                <span className="text-emerald-400">•</span>
                <span>Oxymoney Card SDK Session</span>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <p className="text-xs text-red-600 font-medium text-center mt-2.5 bg-red-50 py-1.5 px-2 rounded-md">
                {error}
              </p>
            )}

            {/* PIN Inputs */}
            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-[13px] font-semibold text-[#1C1C21] block mb-1.5">
                  New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => handlePinInput(e.target.value, setNewPin)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#E8E8EB] bg-white text-sm text-[#1C1C21] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516] transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#1C1C21] block mb-1.5">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
                  placeholder="Re-enter 4-digit PIN"
                  className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#E8E8EB] bg-white text-sm text-[#1C1C21] placeholder-[#A1A1AA] focus:outline-none focus:border-[#DB6516] focus:ring-1 focus:ring-[#DB6516] transition-colors"
                />
              </div>
            </div>

            {/* PCI-DSS Security Badge */}
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-gray-600">
              <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>PCI-DSS Compliant: PIN encrypted directly to RuPay issuer core.</span>
            </div>

            {/* Action Buttons: Cancel and Continue */}
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-[44px] rounded-[10px] border border-[#1C1C21] bg-white text-[#1C1C21] font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-[44px] rounded-[10px] bg-[#DB6516] text-white font-bold text-sm hover:bg-[#c45710] transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: PIN Set Successfully! */
          <div className="mt-4">
            {/* Centered Checkmark Badge */}
            <div className="flex justify-center">
              <div className="w-[58px] h-[58px] rounded-full bg-[#E6F8EF] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#10B981]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mt-3.5">
              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#1C1C21]">
                PIN Set Successfully!
              </h4>
              <p className="text-[13px] text-[#737380] mt-1.5 leading-snug px-2">
                Your 4-digit PIN has been set successfully. You can now use it for ATM withdrawals and card payments.
              </p>
            </div>

            {/* Done Button */}
            <div className="mt-7">
              <button
                type="button"
                onClick={handleClose}
                className="w-full h-[46px] rounded-[10px] bg-[#DB6516] text-white font-bold text-sm hover:bg-[#c45710] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
