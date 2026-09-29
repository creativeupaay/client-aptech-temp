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
    <header className="w-full flex items-center justify-between pb-6 pt-1">
      {/* Left: User Welcome & Student ID */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          <span className="underline underline-offset-4 decoration-2 decoration-gray-900 hover:text-[#D85A14] hover:decoration-[#D85A14] transition cursor-pointer">
            Welcome, {userName}
          </span>
        </h2>
        <p className="text-xs text-gray-500 font-medium mt-1">
          Student ID: {studentId}
        </p>
      </div>

      {/* Right: Notification Bell & Initials Avatar */}
      <div className="flex items-center gap-3 relative">
        {/* Notification Bell matching Figma */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-amber-500 hover:bg-gray-50 transition cursor-pointer"
        >
          <Bell size={17} className="text-amber-500 fill-amber-400/20" />
        </button>

        {/* Initials Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="User menu"
            className="w-9 h-9 rounded-full bg-[#D85A14] hover:bg-[#be4c0d] text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer transition select-none"
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
    </header>
  );
};
