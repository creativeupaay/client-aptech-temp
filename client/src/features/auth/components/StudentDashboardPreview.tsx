import React from "react";
import { CreditCard, Award, CheckCircle2, LogOut, ArrowRight, User } from "lucide-react";
import type { AuthSuccessResponse } from "../authApi";

interface StudentDashboardPreviewProps {
  data: AuthSuccessResponse["data"];
  onLogout: () => void;
}

export const StudentDashboardPreview: React.FC<StudentDashboardPreviewProps> = ({
  data,
  onLogout,
}) => {
  const { user, card } = data;

  return (
    <div className="animate-fade-in" style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
      {/* Success Badge */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "9999px",
            backgroundColor: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#065F46",
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "16px",
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          <span>Mobile Number Verified & Logged In</span>
        </div>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "#18191f",
            letterSpacing: "-0.5px",
            marginBottom: "6px",
          }}
        >
          Welcome, {user.name}!
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Your student card account is active and ready.
        </p>
      </div>

      {/* Interactive Card Mockup */}
      <div
        style={{
          background: "linear-gradient(135deg, #18191F 0%, #2A2D37 100%)",
          borderRadius: "16px",
          padding: "24px",
          color: "#ffffff",
          boxShadow: "0 14px 30px -5px rgba(0, 0, 0, 0.25)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Card background sheen */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(216, 90, 20, 0.35) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", position: "relative", zIndex: 1 }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#eba014", textTransform: "uppercase" }}>
              Aptech Student Card
            </span>
            <p style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
              {card.cardType} EDITION
            </p>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: card.status === "ACTIVE" ? "#059669" : "rgba(235, 160, 20, 0.2)",
              color: card.status === "ACTIVE" ? "#ffffff" : "#eba014",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              border: "1px solid rgba(235, 160, 20, 0.3)",
            }}
          >
            {card.status}
          </div>
        </div>

        {/* Card Number / Kit representation */}
        <div style={{ marginBottom: "24px", position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "monospace", fontSize: "18px", letterSpacing: "3px", color: "#E2E5EC" }}>
            {card.maskedPan || "•••• •••• •••• ••••"}
          </div>
          <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
            {card.status === "NOT_APPLIED" ? "Card will be linked upon issuance" : "Active Card"}
          </span>
        </div>

        {/* Cardholder details */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
          <div>
            <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "#9CA3AF" }}>Cardholder</span>
            <p style={{ fontSize: "14px", fontWeight: 600 }}>{user.name}</p>
          </div>
          <CreditCard size={28} color="#eba014" />
        </div>
      </div>

      {/* Account Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            backgroundColor: "#FAF3E8",
            border: "1px solid #F0DFCC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#D85A14", marginBottom: "6px" }}>
            <Award size={18} />
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Loyalty Coins</span>
          </div>
          <p style={{ fontSize: "22px", fontWeight: 800, color: "#18191f" }}>
            0 <span style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>Coins</span>
          </p>
          <span style={{ fontSize: "11px", color: "#8e95a3" }}>Ready for rewards engine</span>
        </div>

        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E5EC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4B5563", marginBottom: "6px" }}>
            <User size={18} />
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Account Type</span>
          </div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#18191f" }}>
            {user.userType === "non_aptech_student" ? "Prospective Student" : "Aptech Student"}
          </p>
          <span style={{ fontSize: "11px", color: "#8e95a3" }}>{user.mobile}</span>
        </div>
      </div>

      {/* Next Step Action Button */}
      <button
        type="button"
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: "#d85a14",
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 700,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "12px",
          boxShadow: "0 4px 12px rgba(216, 90, 20, 0.25)",
        }}
      >
        <span>Apply for Student Prepaid Card</span>
        <ArrowRight size={18} />
      </button>

      {/* Logout button */}
      <button
        type="button"
        onClick={onLogout}
        style={{
          width: "100%",
          height: "40px",
          background: "transparent",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#d85a14")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
      >
        <LogOut size={16} />
        <span>Log Out & Return to Sign Up</span>
      </button>
    </div>
  );
};
