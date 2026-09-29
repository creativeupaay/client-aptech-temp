import React, { useState } from "react";
import { Button } from "../../../components/ui";
import { GeneratePinModal } from "./GeneratePinModal";

interface CardControlsProps {
  initialEnabled?: boolean;
  initialLocked?: boolean;
  onGeneratePin?: () => void;
  onToggleEnabled?: (enabled: boolean) => void;
  onToggleLock?: (locked: boolean) => void;
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
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const handleGeneratePinClick = () => {
    setIsPinModalOpen(true);
    onGeneratePin?.();
  };

  const handleToggleEnabled = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    onToggleEnabled?.(next);
  };

  const handleToggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    onToggleLock?.(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E8EB] p-5 sm:p-6 shadow-2xs w-full max-w-[560px]">
      {/* Title & Description */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-[#1C1C21]">
          Card Controls
        </h3>
        <p className="text-xs sm:text-sm text-[#737380] mt-1">
          Manage your card PIN, usage, and lock status from one place.
        </p>
      </div>

      {/* Controls 3-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-5">
        {/* 1. Generate PIN */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3 sm:p-3.5 flex flex-col justify-between h-[100px] max-h-[100px]">
          <div>
            <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Generate PIN</h4>
            <p className="text-xs text-[#737380] mt-0.5 leading-tight">
              Set your card PIN
            </p>
          </div>
          <div>
            <Button
              onClick={handleGeneratePinClick}
              className="h-[30px] px-3.5 text-xs font-semibold rounded-[6px] shadow-none"
            >
              Generate PIN
            </Button>
          </div>
        </div>

        {/* 2. Enable / Disable */}
        <div className="rounded-[14px] border border-[#E8E8EB] bg-[#FAFAFB] p-3 sm:p-3.5 flex flex-col justify-between h-[100px] max-h-[100px]">
          <div>
            <h4 className="text-sm font-bold text-[#1C1C21] leading-tight">Enable / Disable</h4>
            <p className="text-xs text-[#737380] mt-0.5 leading-tight">
              Toggle card usage
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
            <p className="text-xs text-[#737380] mt-0.5 leading-tight">
              Permanent Lock
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

      {/* Generate PIN Flow Modal */}
      <GeneratePinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};

