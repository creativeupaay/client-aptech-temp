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
      className="relative rounded-2xl border border-amber-200/90 px-5 py-4 shadow-2xs overflow-hidden flex flex-col justify-between gap-3 min-h-[140px]"
      style={{
        backgroundImage: `url(${coursesBannerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top Header & Discount Tag */}
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
            Explore Upcoming Courses
          </h3>
          <span className="inline-flex items-center gap-1.5 bg-[#D85A14] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
            <Tag size={11} className="rotate-90" />
            20% Early Bird Discount
          </span>
        </div>
        <p className="text-xs text-gray-700 font-medium mt-1">
          Build in-demand skills and earn industry-recognized certifications.
        </p>
      </div>

      {/* Bottom Row: Partner Logos & Browse CTA */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Partner Logos */}
        <div className="flex items-center gap-2">
          <div className="bg-white px-3 py-1 rounded-full border border-amber-200/90 shadow-2xs flex items-center justify-center h-7">
            <img
              src={maacLogo}
              alt="MAAC"
              className="h-4 object-contain"
            />
          </div>
          <div className="bg-white px-2 py-0.5 rounded-xs border border-amber-200/90 shadow-2xs flex items-center justify-center h-7">
            <img
              src={arenaAnimationsLogo}
              alt="Arena Animation"
              className="h-4 object-contain"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onBrowseCourses}
          className="bg-[#D85A14] hover:bg-[#be4c0d] text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-[0.98]"
        >
          <span>Browse Courses</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
