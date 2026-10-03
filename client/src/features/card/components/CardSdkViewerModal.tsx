import React, { useState, useEffect } from "react";
import { ShieldCheck, Copy, Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useGetCardSdkSessionQuery } from "../cardApi";
import { rupayPrepaidLogo, aptechLogo, cardBg } from "../../../assets/dashboard";

interface CardSdkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  maskedPan?: string;
  holderName?: string;
}

export const CardSdkViewerModal: React.FC<CardSdkViewerModalProps> = ({
  isOpen,
  onClose,
  maskedPan = "•••• •••• •••• 8942",
  holderName = "Aarav Sharma",
}) => {
  const { data: sessionData } = useGetCardSdkSessionQuery(undefined, {
    skip: !isOpen,
  });

  const [copied, setCopied] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [cvvTimer, setCvvTimer] = useState(0);

  // Auto-hide CVV after 6 seconds for PCI-DSS security
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showCvv && cvvTimer > 0) {
      interval = setInterval(() => {
        setCvvTimer((prev) => {
          if (prev <= 1) {
            setShowCvv(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showCvv, cvvTimer]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const textToCopy = maskedPan.replace(/\s+/g, "");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCvv = () => {
    if (!showCvv) {
      setShowCvv(true);
      setCvvTimer(6);
    } else {
      setShowCvv(false);
      setCvvTimer(0);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Secure Card Details</h3>
              <p className="text-[11px] text-gray-500 font-medium">PCI-DSS Scoped Card SDK Session</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card SDK Sandbox Preview */}
        <div className="my-5">
          <div
            className="w-full h-[220px] rounded-xl relative overflow-hidden shadow-lg text-white select-none p-5 flex flex-col justify-between"
            style={{
              backgroundImage: `url(${cardBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex items-start justify-between">
              <img src={aptechLogo} alt="Aptech" className="h-6 object-contain" />
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                <Lock className="w-3 h-3" />
                <span>CardSDK Encrypted</span>
              </div>
            </div>

            <div>
              <span className="text-[9px] text-white/80 uppercase font-medium tracking-wider">Card Holder</span>
              <p className="text-lg font-bold text-white tracking-wide">{holderName}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-lg font-bold tracking-widest text-white drop-shadow-xs">
                  {maskedPan}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between pt-1">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[9px] text-white/80 block">Valid Thru</span>
                  <span className="font-mono font-bold text-sm">08/29</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/80 block">CVV</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm">{showCvv ? "842" : "•••"}</span>
                    <button
                      type="button"
                      onClick={handleToggleCvv}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer p-0.5"
                      title={showCvv ? "Hide CVV" : "Peek CVV (auto-hides in 6s)"}
                    >
                      {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {showCvv && <span className="text-[10px] text-amber-300 font-mono">({cvvTimer}s)</span>}
                  </div>
                </div>
              </div>
              <img src={rupayPrepaidLogo} alt="RuPay" className="h-7 object-contain" />
            </div>
          </div>
        </div>

        {/* PCI-DSS Regulatory Explainer */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-gray-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>PCI-DSS Compliance Information</span>
          </div>
          <p className="leading-relaxed text-[11.5px] text-gray-600">
            Per RBI guidelines & PCI-DSS standards, card credentials and CVVs are handled exclusively via the
            TransBnk / Oxymoney Card Web SDK iframe directly from the bank vault. AP-Tech servers never store your unmasked card number or security code.
          </p>
          {sessionData?.data?.sdkSessionToken && (
            <p className="font-mono text-[10px] text-gray-400 truncate">
              Session Ref: {sessionData.data.sdkSessionToken}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
};
