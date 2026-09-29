import React from "react";
import { ShieldCheck, HandCoins, TrendingUp, PiggyBank } from "lucide-react";

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
    <div className="rounded-2xl border border-orange-200/90 bg-[#FFFDF9] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left Text */}
      <div className="max-w-[280px]">
        <h3 className="text-sm font-bold text-gray-900">
          Explore Financial Solutions
        </h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
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
              className="rounded-xl border border-[#FDBA74] bg-white/80 hover:bg-white p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group active:scale-[0.98]"
            >
              <IconComponent
                size={22}
                className="text-[#D85A14] group-hover:scale-105 transition-transform"
                strokeWidth={1.5}
              />
              <span className="text-[11px] font-bold text-[#D85A14] tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
