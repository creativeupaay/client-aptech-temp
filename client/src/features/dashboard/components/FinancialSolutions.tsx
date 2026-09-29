import React from "react";
import { ShieldCheck, HandCoins, TrendingUp, PiggyBank } from "lucide-react";
import { financialSolutionBg } from "../../../assets/dashboard";

interface FinancialSolutionsProps {
  onSelectSolution?: (type: string) => void;
}

export const FinancialSolutions: React.FC<FinancialSolutionsProps> = ({
  onSelectSolution,
}) => {
  const solutions = [
    { id: "insurance", label: "Insurance", icon: ShieldCheck },
    { id: "loan", label: "Loan", icon: HandCoins },
    { id: "investment", label: "Investment", icon: TrendingUp },
    { id: "fd", label: "FD", icon: PiggyBank },
  ];

  return (
    <div className="relative rounded-2xl border border-[#E8E8EB] min-h-[113px] sm:h-[113px] sm:max-h-[113px] overflow-hidden shadow-2xs">
      {/* 1. Underlying Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url(${financialSolutionBg})`,
        }}
      />

      {/* 2. Frosted Blur Overlay: #FFFFFF42 + backdrop-filter blur(7.3px) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: "#FFFFFF42",
          backdropFilter: "blur(7.3px)",
          WebkitBackdropFilter: "blur(7.3px)",
        }}
      />

      {/* 3. Foreground Content */}
      <div className="relative z-10 w-full h-full px-5 sm:px-6 py-[17px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Text */}
        <div className="max-w-[320px]">
          <h3
            className="tracking-tight"
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              lineHeight: "120%",
              letterSpacing: "0%",
              color: "#111827",
            }}
          >
            Explore Financial Solutions
          </h3>
          <p
            className="mt-1"
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "13px",
              lineHeight: "140%",
              letterSpacing: "0%",
              color: "#853500",
            }}
          >
            Insurance, loans, investments, and fixed deposits—all in one place.
          </p>
        </div>

        {/* Right 4-Grid of Outline Buttons */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {solutions.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSolution?.(item.id)}
                className="w-[70px] sm:w-[76px] h-[79px] max-h-[79px] rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-[0.98]"
                style={{
                  border: "1px solid #DB6516",
                  boxShadow: "0px 3px 5.8px -2px #DB651669",
                  backdropFilter: "blur(0px)",
                  WebkitBackdropFilter: "blur(0px)",
                }}
              >
                <IconComponent
                  size={22}
                  className="text-[#DB6516] group-hover:scale-105 transition-transform"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] font-bold text-[#DB6516] tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
