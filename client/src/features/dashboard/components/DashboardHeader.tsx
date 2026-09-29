import React, { useState } from "react";
import { Bell, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string;
  studentId?: string;
  initials?: string;
  onLogout?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = "Aarav Sharma",
  studentId = "APT-2026-00417",
  initials = "AS",
  onLogout,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#E8E8EB] h-[72px] flex items-center shrink-0">
      <div className="max-w-[1344px] w-full mx-auto px-4 sm:px-6 min-[1344px]:px-0 flex items-center justify-between">
        {/* Left: User Welcome & Student ID */}
        <div className="flex flex-col justify-center">
          <h2 className="text-[18px] font-bold text-[#1C1C21] leading-tight tracking-tight">
            Welcome, {userName}
          </h2>
          <p className="text-[13px] font-normal text-[#737380] leading-tight mt-0.5">
            Student ID: {studentId}
          </p>
        </div>

        {/* Right: Notification Bell & Initials Avatar */}
        <div className="flex items-center gap-3 relative">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-[#F7F7F8]  flex items-center justify-center text-[#EBA014] hover:bg-[#EEEEF0] transition cursor-pointer"
          >
            <Bell size={18} className="text-[#EBA014] fill-[#EBA014]" />
          </button>

          {/* Initials Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="User menu"
              className="w-10 h-10 rounded-full bg-[#D85A14] hover:bg-[#be4c0d] text-white font-bold text-sm flex items-center justify-center shadow-xs cursor-pointer transition select-none"
            >
              {initials}
            </button>

            {/* Quick Profile / Logout Dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">{userName}</p>
                  <p className="text-[11px] text-gray-400">{studentId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onLogout?.();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
