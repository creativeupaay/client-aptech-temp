import React from "react";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../auth/authApi";
import {
  DashboardHeader,
  CardSection,
  CardBalanceBar,
  KycBanner,
  RewardStats,
  CardControls,
  CoursesBanner,
  RecentTransactions,
  FinancialSolutions,
  HelpSupport,
} from "./components";
import { MOCK_DASHBOARD_DATA } from "./mockData";

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("tbx_auth_token");
      localStorage.removeItem("tbx_student_user");
      navigate("/login", { replace: true });
    }
  };

  // Strictly use mock data as instructed: "use mock data for now but make the UI exactly same"
  const user = {
    name: MOCK_DASHBOARD_DATA.user.name,
    studentId: MOCK_DASHBOARD_DATA.user.studentId,
    initials: MOCK_DASHBOARD_DATA.user.initials,
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col">
        {/* Top Header */}
        <DashboardHeader
          userName={user.name}
          studentId={user.studentId}
          initials={user.initials}
          onLogout={handleLogout}
        />

        {/* Section Heading */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            My Cards & Activity
          </h1>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left Column: Card & Wallet Controls */}
          <div className="flex flex-col gap-4">
            {/* Prepaid Card Display & Management */}
            <CardSection
              holderName={user.name}
              maskedPan={MOCK_DASHBOARD_DATA.card.maskedPan}
              expiry={MOCK_DASHBOARD_DATA.card.expiry}
              cvv={MOCK_DASHBOARD_DATA.card.cvv}
            />

            {/* Balances, Limits & Load Money */}
            <CardBalanceBar
              usedAmount={MOCK_DASHBOARD_DATA.card.usedAmount}
              totalLimit={MOCK_DASHBOARD_DATA.card.totalLimit}
              availableBalance={MOCK_DASHBOARD_DATA.card.availableBalance}
            />

            {/* KYC Upgrade Banner */}
            <KycBanner />

            {/* Rewards: Cashback, Loyalty Points, Redeem Vouchers */}
            <RewardStats
              cashback={MOCK_DASHBOARD_DATA.rewards.cashback}
              loyaltyPoints={MOCK_DASHBOARD_DATA.rewards.loyaltyPoints}
            />

            {/* Card Controls: PIN & Toggles */}
            <CardControls
              initialEnabled={MOCK_DASHBOARD_DATA.card.isCardEnabled}
              initialLocked={MOCK_DASHBOARD_DATA.card.isCardLocked}
            />
          </div>

          {/* Right Column: Courses, Transactions, Financial & Support */}
          <div className="flex flex-col gap-4">
            {/* Explore Upcoming Courses Banner */}
            <CoursesBanner />

            {/* Recent Transactions List */}
            <RecentTransactions
              transactions={MOCK_DASHBOARD_DATA.transactions}
            />

            {/* Explore Financial Solutions */}
            <FinancialSolutions />

            {/* Help & Support Contact Cards */}
            <HelpSupport />
          </div>
        </div>
      </div>
    </div>
  );
};
