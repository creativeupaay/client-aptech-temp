import React from "react";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation, useGetMeQuery } from "../auth/authApi";
import { Button } from "../../components/ui";
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
  const { data: meData } = useGetMeQuery();

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

  const storedUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("tbx_student_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const activeUser = meData?.data?.user || storedUser;
  const userName = activeUser?.name || MOCK_DASHBOARD_DATA.user.name;
  const studentId = activeUser?.studentId || MOCK_DASHBOARD_DATA.user.studentId;
  const initials =
    userName
      .split(" ")
      .map((part: string) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || MOCK_DASHBOARD_DATA.user.initials;

  const user = {
    name: userName,
    studentId,
    initials,
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 flex flex-col font-sans">
      {/* Top Header (Edge-to-Edge 72px Bar) */}
      <DashboardHeader
        userName={user.name}
        studentId={user.studentId}
        initials={user.initials}
        onLogout={handleLogout}
      />

      <main className="max-w-[1344px] w-full mx-auto px-4 sm:px-6 min-[1344px]:px-0 py-6 flex-1 flex flex-col">
        {/* Section Heading */}
        <div className="mb-4 flex items-center">
          <h1
            className="text-[#1C1C21]"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "28px",
              lineHeight: "48px",
              letterSpacing: "0px",
              verticalAlign: "middle",
            }}
          >
            My Cards & Activity
          </h1>
        </div>

        {/* Top Action Pill: Card Management Button (Height: 40px) */}
        <div className="mb-6 flex items-center">
          <Button className="h-[40px] px-5 text-sm font-semibold rounded-lg shadow-2xs">
            Card management
          </Button>
        </div>

        {/* 2-Column Responsive Dashboard Layout: Left 560px, Right 760px, Gap 24px */}
        <div className="grid grid-cols-1 xl:grid-cols-[560px_1fr] min-[1344px]:grid-cols-[560px_760px] gap-6 items-start w-full">
          {/* Left Column: Card & Wallet Controls (Max 560px) */}
          <div className="w-full max-w-[560px] flex flex-col gap-4">
            {/* Prepaid Card Display & Management */}
            <CardSection
              holderName={user.name}
              cardNumber={MOCK_DASHBOARD_DATA.card.cardNumber}
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

          {/* Right Column: Courses, Transactions, Financial & Support (Max 760px) */}
          <div className="w-full max-w-[760px] flex flex-col gap-4">
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
      </main>
    </div>
  );
};
