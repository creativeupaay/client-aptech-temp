import React, { useState } from "react";
import { CardSim, Wifi } from "lucide-react";
import {
  cardBg,
  rupayPrepaidLogo,
} from "../../../assets/dashboard";

interface CardSectionProps {
  holderName?: string;
  maskedPan?: string;
  expiry?: string;
  cvv?: string;
  onViewDetails?: () => void;
}

export const CardSection: React.FC<CardSectionProps> = ({
  holderName = "Aarav Sharma",
  maskedPan = "••••  ••••  ••••  ••••",
  expiry = "••/••",
  cvv = "•••",
  onViewDetails,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleDetails = () => {
    setShowDetails((prev) => !prev);
    onViewDetails?.();
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top action pill */}
      <div>
        <button
          type="button"
          className="bg-aptech-primary hover:bg-aptech-primary-hover text-white text-xs font-semibold px-4 py-1.5 rounded-md cursor-pointer transition shadow-2xs"
        >
          Card management
        </button>
      </div>

      {/* The Physical Card Mockup */}
      <div
        className="w-full relative rounded-2xl overflow-hidden shadow-sm text-white aspect-[2/1] select-none p-5 sm:p-6 flex flex-col justify-between"
      style={{
          backgroundImage: `url(${cardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

        {/* Card Middle: Holder Name, Chip & Contactless */}
        <div className="relative z-10 flex flex-col gap-1.5 my-auto">
          <div>
            <span className="text-[9px] tracking-wider text-white/80 uppercase font-medium block">
              CARD HOLDER NAME
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
              {holderName}
            </p>
          </div>

          {/* Chip & NFC Contactless in White matching Figma */}
          <div className="flex items-center gap-2.5 my-1">
            <div className="text-white drop-shadow-xs">
              <CardSim size={28} strokeWidth={1.5} />
            </div>
            <div className="text-white drop-shadow-xs rotate-90">
              <Wifi size={20} strokeWidth={2} />
            </div>
          </div>

          {/* Masked Card Number */}
          <div className="font-mono text-base sm:text-lg font-bold tracking-[0.22em] text-white drop-shadow-xs">
            {showDetails ? "4532  8912  4401  9821" : maskedPan}
          </div>
        </div>

        {/* Card Footer: Expiry, CVV & RuPay Prepaid Logo */}
        <div className="relative z-10 flex items-end justify-between pt-1">
          <div className="flex items-center gap-5 text-xs text-white">
            <div>
              <span className="text-[8px] text-white/80 block uppercase tracking-wider font-medium">
                Expiry
              </span>
              <span className="font-mono font-bold tracking-widest text-xs">
                {showDetails ? "09/30" : expiry}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-white/80 block uppercase tracking-wider font-medium">
                CVV
              </span>
              <span className="font-mono font-bold tracking-widest text-xs">
                {showDetails ? "849" : cvv}
              </span>
            </div>
          </div>

          {/* RuPay Prepaid Logo */}
          <div className="flex flex-col items-end">
            <img
              src={rupayPrepaidLogo}
              alt="RuPay PREPAID"
              className="h-8 sm:h-9 object-contain drop-shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* View Card Details Button */}
      <button
        type="button"
        onClick={handleToggleDetails}
        className="w-full bg-[#D85A14] hover:bg-[#be4c0d] text-white font-medium text-xs sm:text-sm py-2.5 rounded-xl text-center shadow-2xs cursor-pointer transition active:scale-[0.99]"
      >
        {showDetails ? "Hide Card Details" : "View Card Details"}
      </button>
    </div>
  );
};
