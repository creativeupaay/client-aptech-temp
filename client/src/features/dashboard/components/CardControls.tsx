import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui";
import { useCardSdk } from "../../card";
import { Loader2, AlertCircle } from "lucide-react";

interface CardControlsProps {
  initialEnabled?: boolean;
  initialLocked?: boolean;
  maskedPan?: string;
  holderName?: string;
  onGeneratePin?: () => void;
  onToggleEnabled?: (enabled: boolean) => void | Promise<void>;
  onToggleLock?: (locked: boolean) => void | Promise<void>;
}

export const CardControls: React.FC<CardControlsProps> = ({
  initialEnabled = true,
  initialLocked = false,
  onGeneratePin,
  onToggleEnabled,
  onToggleLock,
}) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [isLaunchingPin, setIsLaunchingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const { launchSdk } = useCardSdk();

  useEffect(() => {
    setIsEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setIsLocked(initialLocked);
  }, [initialLocked]);

  const handleGeneratePinClick = async () => {
    setPinError(null);
    setIsLaunchingPin(true);
    try {
      await launchSdk();
      onGeneratePin?.();
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : "Failed to open official Card SDK.");
    } finally {
      setIsLaunchingPin(false);
    }
  };

  const handleToggleEnabled = async () => {
    const next = !isEnabled;
    setIsEnabled(next);
    try {
      await onToggleEnabled?.(next);
    } catch {
      setIsEnabled(!next);
    }
  };

  const handleToggleLock = async () => {
    const next = !isLocked;
    setIsLocked(next);
    try {
      await onToggleLock?.(next);
    } catch {
      setIsLocked(!next);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8EB] p-5 sm:p-6 shadow-2xs w-full max-w-[560px]">
      {/* Title & Description */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#1C1C21]">
          Card Controls
        </h3>
        <p className="text-xs sm:text-sm text-[#737380] mt-1">
          Manage your card PIN, usage, and lock status securely via RuPay Core.
        </p>
      </div>

      {/* Controls 3-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-5">
        {/* 1. Generate PIN */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3 sm:p-3.5 flex flex-col justify-between h-[100px] max-h-[100px]">
          <div>
            <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Generate PIN</h4>
            <p className="text-xs text-[#737380] mt-0.5 leading-tight">
              PCI-DSS Secure PIN
            </p>
          </div>
          <div>
            <Button
              onClick={handleGeneratePinClick}
              disabled={isLaunchingPin}
              className="h-[30px] px-3.5 text-xs font-semibold rounded-[6px] shadow-none bg-[#DB6516] hover:bg-[#c45710] text-white flex items-center gap-1.5 cursor-pointer"
            >
              {isLaunchingPin ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                "Set PIN"
              )}
            </Button>
          </div>
        </div>

        {/* 2. Enable / Disable */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3 sm:p-3.5 flex flex-col justify-between h-[100px] max-h-[100px]">
          <div>
            <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Enable / Disable</h4>
            <p className="text-xs font-medium text-[#737380] mt-0.5 leading-tight">
              {isEnabled ? "Card Active" : "Card Disabled"}
            </p>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={handleToggleEnabled}
              className={`w-[44px] h-[25px] flex items-center rounded-full p-[2.5px] cursor-pointer transition-colors duration-200 ease-in-out ${
                isEnabled ? "bg-[#48CD5E]" : "bg-[#DEDEE1]"
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-in-out ${
                  isEnabled ? "translate-x-[19px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Lock Card */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3 sm:p-3.5 flex flex-col justify-between h-[100px] max-h-[100px]">
          <div>
            <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Lock Card</h4>
            <p className="text-xs font-medium text-[#737380] mt-0.5 leading-tight">
              {isLocked ? "Card Locked" : "Card Unlocked"}
            </p>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={isLocked}
              onClick={handleToggleLock}
              className={`w-[44px] h-[25px] flex items-center rounded-full p-[2.5px] cursor-pointer transition-colors duration-200 ease-in-out ${
                isLocked ? "bg-[#DB6516]" : "bg-[#DEDEE1]"
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-in-out ${
                  isLocked ? "translate-x-[19px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {pinError && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{pinError}</span>
        </div>
      )}
    </div>
  );
};



