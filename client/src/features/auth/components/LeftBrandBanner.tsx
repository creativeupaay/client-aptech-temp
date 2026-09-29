import React from "react";
import { GraduationCap, Building2, Globe, Users } from "lucide-react";
import { aptechLogo } from "../../../assets/dashboard";

export const LeftBrandBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-8 md:p-12 lg:p-14 bg-gradient-to-br from-[#FFFDF8] via-[#FAF3E8] to-aptech-warm-darker border-r border-[#E2D7C3]/40 min-h-full w-full">
      {/* Decorative background geometry */}
      <div className="absolute -top-[15%] -right-[10%] w-[550px] height-[550px] bg-radial from-aptech-amber/10 via-aptech-primary/5 to-transparent rounded-full pointer-events-none" />
      <div className="absolute -bottom-[10%] -left-[10%] w-[450px] height-[450px] bg-radial from-aptech-primary/5 to-transparent rounded-full pointer-events-none" />

      {/* Top Header: Logo + EST. 1986 Badge */}
      <div className="flex justify-between items-start relative z-10">
        {/* Aptech Logo */}
        <div className="flex flex-col">
          <img
            src={aptechLogo}
            alt="Aptech - Unleash your potential"
            className="h-10 sm:h-12 object-contain"
          />
        </div>

        {/* EST. 1986 Badge */}
        <div className="bg-aptech-primary text-white px-4 py-2 rounded-full text-xs font-bold tracking-wider shadow-sm">
          EST. 1986
        </div>
      </div>

      {/* Middle Hero Section */}
      <div className="my-10 lg:my-14 relative z-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-aptech-charcoal tracking-tight leading-tight mb-1">
          Millions of careers.
        </h1>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-aptech-amber tracking-tight leading-tight mb-6">
          One unwavering
          <br />
          mission.
        </h1>

        <div className="flex items-center gap-2.5">
          <span className="w-7 h-0.5 bg-aptech-primary inline-block" />
          <p className="text-sm lg:text-base text-gray-500 font-medium">
            Celebrating{" "}
            <span className="text-aptech-primary font-bold">4 Decades</span> of
            Aptech
          </p>
        </div>

        {/* Divider line */}
        <div className="mt-8 h-px bg-[#F0DFCC] w-full" />
      </div>

      {/* Bottom 2x2 Stats Grid */}
      <div className="grid grid-cols-2 gap-6 lg:gap-8 relative z-10">
        {/* Stat 1 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-aptech-primary/10 flex items-center justify-center text-aptech-primary shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-aptech-charcoal leading-none">
              40<span className="text-aptech-primary text-lg font-bold">+</span>
            </div>
            <p className="text-xs font-semibold text-aptech-muted tracking-wider uppercase mt-1">
              Years of Experience
            </p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-aptech-primary/10 flex items-center justify-center text-aptech-primary shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-aptech-charcoal leading-none">
              740<span className="text-aptech-primary text-lg font-bold">+</span>
            </div>
            <p className="text-xs font-semibold text-aptech-muted tracking-wider uppercase mt-1">
              Training Centres
            </p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-aptech-primary/10 flex items-center justify-center text-aptech-primary shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-aptech-charcoal leading-none">
              200<span className="text-aptech-primary text-lg font-bold">+</span>
            </div>
            <p className="text-xs font-semibold text-aptech-muted tracking-wider uppercase mt-1">
              Cities Worldwide
            </p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-aptech-primary/10 flex items-center justify-center text-aptech-primary shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-aptech-charcoal leading-none">
              75L<span className="text-aptech-primary text-lg font-bold">+</span>
            </div>
            <p className="text-xs font-semibold text-aptech-muted tracking-wider uppercase mt-1">
              Students Trained
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
