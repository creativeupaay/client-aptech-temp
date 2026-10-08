import React, { useState } from "react";
import { Button } from "../../../components/ui";
import { useCardSdk } from "../../card";
import { Loader2, AlertCircle, ShieldCheck, SlidersHorizontal } from "lucide-react";

interface CardControlsProps {
  maskedPan?: string;
  holderName?: string;
}

export const CardControls: React.FC<CardControlsProps> = () => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { launchSdk } = useCardSdk();

  const handleOpenControls = async () => {
    setErrorMsg(null);
    setIsLaunching(true);
    try {
      await launchSdk();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to open Oxymoney Card SDK.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8EB] p-5 sm:p-6 shadow-2xs w-full max-w-[560px]">
      {/* Title & Description */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#1C1C21]">
          Card Controls & Security
        </h3>
        <p className="text-xs sm:text-sm text-[#737380] mt-1">
          Manage your PIN, card lock, transaction limits, and channels securely via Oxymoney.
        </p>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-5">
        {/* 1. Generate / Reset PIN */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3.5 flex flex-col justify-between h-[110px]">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#DB6516]" />
              <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">PIN Management</h4>
            </div>
            <p className="text-xs text-[#737380] mt-1 leading-tight">
              PCI-DSS Secure PIN setup & reset
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenControls}
              disabled={isLaunching}
              className="h-[30px] px-3.5 text-xs font-semibold rounded-[6px] shadow-none bg-[#DB6516] hover:bg-[#c45710] text-white flex items-center gap-1.5 cursor-pointer"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Set / Reset PIN"
              )}
            </Button>
          </div>
        </div>

        {/* 2. Card Controls & Lock */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3.5 flex flex-col justify-between h-[110px]">
          <div>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#DB6516]" />
              <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Card Controls</h4>
            </div>
            <p className="text-xs text-[#737380] mt-1 leading-tight">
              Lock card, channels & limit rules
            </p>
          </div>
          <div>
            <Button
              onClick={handleOpenControls}
              disabled={isLaunching}
              variant="outline"
              className="h-[30px] px-3.5 text-xs font-semibold rounded-[6px] border-[#DB6516] text-[#DB6516] hover:bg-[#FFF5EE] flex items-center gap-1.5 cursor-pointer"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Manage Controls"
              )}
            </Button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
