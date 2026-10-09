import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export const AccessViaProconnectPage: React.FC = () => {
  useEffect(() => {
    // Clear any expired/stale auth credentials
    localStorage.removeItem("tbx_auth_token");
    localStorage.removeItem("tbx_student_user");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-red-100/80 rounded-2xl p-6 sm:p-8 text-center shadow-lg shadow-red-500/5">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle size={24} strokeWidth={2.2} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">
          Session Expired
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
          Session expired, log in again.
        </p>
      </div>
    </div>
  );
};
