import React, { useState } from "react";

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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
      {/* Title & Description */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">Card Controls</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your card PIN, usage, and lock status from one place.
        </p>
      </div>

      {/* Controls 3-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Generate PIN */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3.5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-800">Generate PIN</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
              Set your card PIN
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={onGeneratePin}
              className="bg-[#D85A14] hover:bg-[#be4c0d] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer transition shadow-2xs active:scale-[0.98]"
            >
              Generate PIN
            </button>
          </div>
        </div>

        {/* Enable / Disable */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3.5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-800">Enable / Disable</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
              Toggle card usage
            </p>
          </div>
          <div>
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={handleToggleEnabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                isEnabled ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Lock Card */}
        <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3.5 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-gray-800">Lock Card</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
              Permanent Lock
            </p>
          </div>
          <div>
            <button
              type="button"
              role="switch"
              aria-checked={isLocked}
              onClick={handleToggleLock}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                isLocked ? "bg-red-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isLocked ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
