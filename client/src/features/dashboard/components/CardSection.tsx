import React, { useState } from "react";
import {
  cardBg,
  aptechLogo,
  rupayPrepaidLogo,
} from "../../../assets/dashboard";
import { Button } from "../../../components/ui";
import { CardSdkViewerModal } from "../../card/components/CardSdkViewerModal";

interface CardSectionProps {
  holderName?: string;
  cardNumber?: string;
  maskedPan?: string;
  expiry?: string;
  cvv?: string;
  onViewDetails?: () => void;
}

/** EMV Chip SVG matching the exact card design */
const EmvChip: React.FC = () => (
  <svg
    width="38"
    height="28"
    viewBox="0 0 38 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 drop-shadow-xs"
  >
    <rect
      x="0.75"
      y="0.75"
      width="36.5"
      height="26.5"
      rx="4.25"
      fill="white"
      fillOpacity="0.12"
      stroke="white"
      strokeWidth="1.5"
    />
    <path
      d="M1 9.5H13C15.4853 9.5 17.5 11.5147 17.5 14C17.5 16.4853 15.4853 18.5 13 18.5H1"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M37 9.5H25C22.5147 9.5 20.5 11.5147 20.5 14C20.5 16.4853 22.5147 18.5 25 18.5H37"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M19 1V9.5M19 18.5V27"
      stroke="white"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

/** 3-Arc Contactless Waves SVG matching the exact card design */
const ContactlessWaves: React.FC = () => (
  <svg
    width="22"
    height="24"
    viewBox="0 0 22 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 drop-shadow-xs"
  >
    <path
      d="M3 8.5C4.8 10.2 4.8 13.8 3 15.5"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M8.5 6C11.5 8.5 11.5 15.5 8.5 18"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M14 3.5C18.2 6.8 18.2 17.2 14 20.5"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const CardSection: React.FC<CardSectionProps> = ({
  holderName = "Aarav Sharma",
  cardNumber,
  maskedPan = "•••• •••• •••• 8942",
  expiry = "••/••",
  onViewDetails,
}) => {
  const [isSdkModalOpen, setIsSdkModalOpen] = useState(false);

  const handleToggleDetails = () => {
    if (onViewDetails) {
      onViewDetails();
      return;
    }
    setIsSdkModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 w-full lg:max-w-[560px]">
      {/* Physical / Virtual Card Mockup */}
      <div
        className="w-full lg:w-[560px] h-[274px] relative overflow-hidden shadow-md text-white select-none p-5 sm:p-7 flex flex-col justify-between"
        style={{
          width: "100%",
          maxWidth: "560px",
          height: "274px",
          borderRadius: "4.43px",
          border: "0.55px solid #FFFFFF4D",
          backdropFilter: "blur(9.416419982910156px)",
          WebkitBackdropFilter: "blur(9.416419982910156px)",
          backgroundImage: `url(${cardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
        }}
      >
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />

        {/* Top: Aptech Brand Logo */}
        <div className="relative z-10 flex items-start justify-between">
          <img
            src={aptechLogo}
            alt="Aptech - Unleash your potential"
            className="h-8 sm:h-9 object-contain drop-shadow-xs"
          />
        </div>

        {/* Middle Section: Cardholder Name, Chip & Contactless */}
        <div className="relative z-10 flex flex-col my-auto">
          {/* Cardholder Name */}
          <div className="mb-2">
            <span className="text-[10px] tracking-wider text-white/90 uppercase font-medium block">
              CARD HOLDER NAME
            </span>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs mt-0.5">
              {holderName}
            </p>
          </div>

          {/* EMV Chip & Contactless Waves */}
          <div className="flex items-center gap-3 my-1">
            <EmvChip />
            <ContactlessWaves />
          </div>

          {/* Card Number: Masked PAN */}
          <div className="mt-2.5">
            <div className="font-mono text-base sm:text-lg font-bold tracking-[0.16em] sm:tracking-[0.2em] text-white drop-shadow-xs">
              {maskedPan || cardNumber || "•••• •••• •••• 8942"}
            </div>
          </div>
        </div>

        {/* Bottom Row: Expiry, CVV & RuPay Prepaid Logo */}
        <div className="relative z-10 flex items-end justify-between pt-1">
          <div className="flex items-center gap-8 sm:gap-10 text-white">
            {/* Expiry */}
            <div>
              <span className="text-[9px] text-white/90 block font-medium">
                Expiry
              </span>
              <span className="font-mono font-bold tracking-widest text-xs sm:text-sm drop-shadow-xs">
                {expiry || "••/••"}
              </span>
            </div>

            {/* CVV */}
            <div>
              <span className="text-[9px] text-white/90 block font-medium">
                CVV
              </span>
              <span className="font-mono font-bold tracking-widest text-xs sm:text-sm drop-shadow-xs">
                •••
              </span>
            </div>
          </div>

          {/* RuPay PREPAID Logo */}
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
      <Button
        onClick={handleToggleDetails}
        className="w-full h-[40px] text-xs sm:text-sm font-semibold rounded-lg text-center shadow-2xs"
      >
        View Card Details
      </Button>

      {/* PCI-DSS Scoped Card SDK Modal */}
      <CardSdkViewerModal
        isOpen={isSdkModalOpen}
        onClose={() => setIsSdkModalOpen(false)}
        maskedPan={maskedPan || cardNumber || "•••• •••• •••• 8942"}
        holderName={holderName}
      />
    </div>
  );
};

