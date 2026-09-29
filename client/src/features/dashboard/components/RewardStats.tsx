import React from "react";
import { ArrowRight } from "lucide-react";

interface RewardStatsProps {
  cashback?: number;
  loyaltyPoints?: number;
  onRedeemVouchers?: () => void;
}

export const RewardStats: React.FC<RewardStatsProps> = ({
  cashback = 42,
  loyaltyPoints = 315,
  onRedeemVouchers,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] w-full max-w-[560px]">
      {/* Cashback Card */}
      <div
        className="w-full sm:w-[143px] h-[73px] rounded-[12px] p-[16px] bg-[#FFFFFF] flex flex-col justify-between shrink-0 shadow-2xs select-none"
        style={{
          height: "73px",
          borderRadius: "12px",
          border: "1px solid #E8E8EB",
          padding: "16px",
          backgroundColor: "#FFFFFF",
          opacity: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#1C1C21",
          }}
        >
          Cashback
        </span>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "18px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#DB6516",
          }}
        >
          +₹{cashback}
        </p>
      </div>

      {/* Loyalty Points Card */}
      <div
        className="w-full sm:w-[143px] h-[73px] rounded-[12px] p-[16px] bg-[#FFFFFF] flex flex-col justify-between shrink-0 shadow-2xs select-none"
        style={{
          height: "73px",
          borderRadius: "12px",
          border: "1px solid #E8E8EB",
          padding: "16px",
          backgroundColor: "#FFFFFF",
          opacity: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#1C1C21",
          }}
        >
          Loyalty Points
        </span>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "18px",
            lineHeight: "100%",
            letterSpacing: "0%",
            color: "#DB6516",
          }}
        >
          {loyaltyPoints}
        </p>
      </div>

      {/* Redeem Vouchers Card with Diagonal Radial Gradients & Crossing Grid Lines */}
      <button
        type="button"
        onClick={onRedeemVouchers}
        className="relative overflow-hidden rounded-[12px] w-full sm:flex-1 h-[73px] flex items-center group cursor-pointer transition-all active:scale-[0.99] text-left shadow-2xs select-none"
        style={{
          height: "73px",
          borderRadius: "12px",
          border: "1px solid #FFBF94",
          background: `
            radial-gradient(120% 120% at 100% 0%, rgba(219, 101, 22, 0.07) 0%, rgba(219, 101, 22, 0.02) 50%, transparent 80%),
            radial-gradient(120% 120% at 0% 100%, rgba(45, 45, 55, 0.04) 0%, rgba(45, 45, 55, 0.01) 45%, transparent 75%),
            #FFFFFF
          `,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          opacity: 1,
        }}
      >
        {/* Horizontal 1px Line (#E8E8EB, opacity: 60%, crossing just below vouchers bottom) */}
        <div
          className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{
            top: "47px",
            backgroundColor: "#E8E8EB",
            opacity: 0.6,
          }}
        />

        {/* Content Row: Text + Vertical Line just after 's' + Arrow in same row */}
        <div className="relative z-10 flex items-center h-full w-full">
          {/* Text block */}
          <div className="pl-[16px] pr-[12px] flex items-center shrink-0">
            <span
              className="whitespace-nowrap"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                lineHeight: "100%",
                letterSpacing: "0%",
                color: "#DB6516",
              }}
            >
              Redeem Vouchers
            </span>
          </div>

          {/* Vertical 1px Line placed just after 's' */}
          <div
            className="w-[1px] h-full shrink-0"
            style={{
              backgroundColor: "#E8E8EB",
              opacity: 0.6,
            }}
          />

          {/* Arrow container - in the exact same row as text */}
          <div className="flex-1 flex items-center justify-center">
            <ArrowRight
              size={18}
              className="text-[#DB6516] transition-transform group-hover:translate-x-1 shrink-0"
              strokeWidth={2}
            />
          </div>
        </div>
      </button>
    </div>
  );
};

