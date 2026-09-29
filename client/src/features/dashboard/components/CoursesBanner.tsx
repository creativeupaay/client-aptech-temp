import React from "react";
import { Tag, ArrowRight } from "lucide-react";
import {
  coursesBannerBg,
  maacLogo,
  arenaAnimationsLogo,
} from "../../../assets/dashboard";

interface CoursesBannerProps {
  onBrowseCourses?: () => void;
}

export const CoursesBanner: React.FC<CoursesBannerProps> = ({
  onBrowseCourses,
}) => {
  return (
    <div
      className="relative rounded-2xl border border-[#F6E3B8] p-5 sm:p-6 shadow-2xs overflow-hidden flex flex-col sm:flex-row justify-between gap-4 min-h-[148px]"
      style={{
        backgroundColor: "#FFF9E6",
        backgroundImage: `url(${coursesBannerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "top 60%",
      }}
    >
      {/* Left Side: Header & Partner Logos */}
      <div className="flex flex-col justify-between z-10 gap-4">
        <div>
          <h3 className="text-lg sm:text-[20px] font-bold text-[#1C1C21] tracking-tight">
            Explore Upcoming Courses
          </h3>
          <p className="text-xs sm:text-[13px] font-semibold text-[#7A3611] mt-1.5 leading-snug">
            Build in-demand skills and earn industry-recognized certifications.
          </p>
        </div>

        {/* Partner Brand Badges */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white px-3.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/80 flex items-center justify-center h-[36px] sm:h-[38px]">
            <img
              src={maacLogo}
              alt="MAAC"
              className="h-[20px] sm:h-[22px] w-auto object-contain"
            />
          </div>
          <div className="bg-white px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-white/80 flex items-center justify-center h-[36px] sm:h-[38px]">
            <img
              src={arenaAnimationsLogo}
              alt="Arena Animation"
              className="h-[22px] sm:h-[24px] w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Side: Discount Badge & CTA Button */}
      <div className="flex flex-col items-start sm:items-end justify-between z-10 gap-3">
        <span className="inline-flex items-center gap-1.5 bg-[#DB6516] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
          <Tag size={12} className="rotate-90" />
          20% Early Bird Discount
        </span>

        <button
          type="button"
          onClick={onBrowseCourses}
          className="bg-[#DB6516] hover:bg-[#c45710] text-white text-sm font-bold h-[42px] px-5 rounded-[10px] inline-flex items-center gap-2 cursor-pointer transition shadow-xs active:scale-[0.98]"
        >
          <span>Browse Courses</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
