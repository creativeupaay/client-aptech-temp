import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLogoutMutation, useGetMeQuery } from "../auth/authApi";
import { useGetHubbleLaunchUrlMutation, useGetHubbleHistoryQuery } from "./hubbleApi";
import {
  useGetCardQuery,
  useGetCardTransactionsQuery,
  usePollCardStatusQuery,
  useCheckKycStatusQuery,
} from "../card/cardApi";
import { clearCardSdkSession } from "../card/hooks/useCardSdk";
import { Button } from "../../components/ui";
import { Loader2 } from "lucide-react";
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
import { KycUpgradedSuccessModal } from "../card/components/KycUpgradedSuccessModal";

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [logoutMutation] = useLogoutMutation();
  const { data: meData } = useGetMeQuery();
  const {
    data: hubbleHistoryData,
    refetch: refetchHubbleHistory,
    isFetching: isHubbleHistoryFetching,
  } = useGetHubbleHistoryQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [getHubbleLaunchUrl] = useGetHubbleLaunchUrlMutation();
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showKycSuccessModal, setShowKycSuccessModal] = useState(false);

  const {
    data: cardRes,
    isLoading: isCardLoading,
    refetch: refetchCard,
  } = useGetCardQuery();
  const {
    data: transactionsRes,
    refetch: refetchCardTransactions,
    isFetching: isTransactionsFetching,
  } = useGetCardTransactionsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const liveCard = cardRes?.data?.card;

  const handleRefreshActivity = () => {
    refetchHubbleHistory();
    refetchCardTransactions();
  };

  const isCardIssued =
    liveCard?.status === "ISSUED" ||
    liveCard?.status === "ACTIVE" ||
    liveCard?.status === "FROZEN" ||
    liveCard?.status === "BLOCKED";

  // Requirement #2: If user does not have any card issued, redirect directly to card issuance
  useEffect(() => {
    if (!isCardLoading && cardRes) {
      if (!isCardIssued && liveCard?.status !== "APPLICATION_PENDING") {
        navigate("/card/issuance", { replace: true });
      }
    }
  }, [isCardLoading, cardRes, isCardIssued, liveCard?.status, navigate]);

  // Poll card creation status if status is APPLICATION_PENDING (API 5)
  usePollCardStatusQuery(undefined, {
    skip: liveCard?.status !== "APPLICATION_PENDING",
    pollingInterval: 2000,
  });

  // Query KYC status if user returned from external portal
  const { data: kycStatusRes } = useCheckKycStatusQuery(undefined, {
    skip: liveCard?.kycStatus === "FULL_KYC",
  });

  useEffect(() => {
    if (searchParams.get("kyc_callback") === "true" || searchParams.get("status") === "success") {
      if (kycStatusRes?.data?.isCompleted) {
        setShowKycSuccessModal(true);
      }
    }
  }, [searchParams, kycStatusRes]);



  const handleRedeemVouchers = async () => {
    if (isLaunching) return;
    setLaunchError(null);
    setIsLaunching(true);
    try {
      const res = await getHubbleLaunchUrl().unwrap();
      if (res?.data?.launchUrl) {
        window.open(res.data.launchUrl, "_blank", "noopener,noreferrer");

        // Automatically trigger fresh refetch when student returns to dashboard tab
        const handleReturnFromHubble = () => {
          handleRefreshActivity();
          window.removeEventListener("focus", handleReturnFromHubble);
        };
        window.addEventListener("focus", handleReturnFromHubble);
        return;
      }
      throw new Error("Missing launch URL in server response.");
    } catch (err) {
      console.error("Hubble launch URL generation failed:", err);
      setLaunchError("Unable to open Voucher Marketplace. Please verify your connection or try again later.");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore network errors on logout
    } finally {
      clearCardSdkSession();
      localStorage.removeItem("tbx_auth_token");
      localStorage.removeItem("tbx_student_user");
      navigate("/", { replace: true });
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
  const userName = activeUser?.name || "Student";
  const studentId = activeUser?.studentId || "";
  const initials =
    userName
      .split(" ")
      .map((part: string) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const user = {
    name: userName,
    studentId,
    initials,
  };

  const transactionsList = React.useMemo(() => {
    const liveCardList = (transactionsRes?.data?.transactions || []).map((t) => ({
      id: t.txnId,
      title: t.title,
      date: new Date(t.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawDate: new Date(t.createdAt).getTime(),
      points: Math.floor(t.amount / 100),
      amount: t.amount,
      type: t.type,
    }));

    interface VoucherItem {
      _id?: string;
      orderId?: string;
      brandName?: string;
      denomination?: number;
      pointsDebited?: number;
      status?: string;
      createdAt?: string;
    }

    const liveVoucherList = ((hubbleHistoryData?.data?.vouchers || []) as VoucherItem[]).map((v) => ({
      id: v._id || v.orderId || `VOUCH-${Date.now()}`,
      title: `Voucher: ${v.brandName || "Brand Gift Card"}`,
      date: v.createdAt
        ? new Date(v.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recent",
      rawDate: v.createdAt ? new Date(v.createdAt).getTime() : 0,
      points: -(v.pointsDebited || 0),
      amount: v.denomination || 0,
      type: "DR" as const,
    }));

    const combined = [...liveCardList, ...liveVoucherList];
    if (combined.length > 0) {
      combined.sort((a, b) => b.rawDate - a.rawDate);
      return combined;
    }

    return [];
  }, [transactionsRes, hubbleHistoryData]);

  if (isCardLoading || (!isCardIssued && liveCard?.status !== "APPLICATION_PENDING")) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            {isCardLoading ? "Loading dashboard..." : "Redirecting to card issuance..."}
          </p>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={() => {
              if (liveCard?.status === "NOT_APPLIED") {
                navigate("/card/issuance");
              } else {
                const el = document.getElementById("card-controls-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="h-[40px] px-5 text-sm font-semibold rounded-lg shadow-2xs cursor-pointer"
          >
            {liveCard?.status === "NOT_APPLIED" ? "Apply for Card" : "Card management"}
          </Button>
        </div>

        {/* 2-Column Responsive Dashboard Layout: Left 560px, Right 760px, Gap 24px */}
        <div className="grid grid-cols-1 xl:grid-cols-[560px_1fr] min-[1344px]:grid-cols-[560px_760px] gap-6 items-start w-full">
          {/* Left Column: Card & Wallet Controls (Max 560px) */}
          <div className="w-full max-w-[560px] flex flex-col gap-4">
            {/* If Card Provisioning in Progress (API 5 Asynchronous polling) */}
            {liveCard?.status === "APPLICATION_PENDING" && (
              <div
                onClick={() => navigate("/card/status")}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-xs animate-pulse cursor-pointer hover:bg-amber-100/60 transition"
              >
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-amber-950 flex items-center justify-between">
                    <span>Card Provisioning in Progress</span>
                    <span className="text-[11px] font-semibold text-amber-700 underline">View Status →</span>
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Your virtual RuPay prepaid card is currently being created on the TransBnk banking gateway. Click to view live progress.
                  </p>
                </div>
              </div>
            )}

            {/* Prepaid Card Display & Management */}
            <CardSection
              holderName={user.name}
              maskedPan={liveCard?.maskedPan || (liveCard?.status === "NOT_APPLIED" ? "Card Not Applied" : "•••• •••• •••• ••••")}
              expiry="••/••"
              cvv="•••"
              onViewDetails={liveCard?.status === "NOT_APPLIED" ? () => navigate("/card/issuance") : undefined}
              onRefreshCard={refetchCard}
            />

            {/* Balances, Limits & Load Money */}
            <CardBalanceBar
              usedAmount={liveCard?.usedAmount ?? 0}
              totalLimit={liveCard?.totalLimit ?? 10000}
              availableBalance={liveCard?.availableBalance ?? 0}
              onLoadMoney={() => navigate("/load-money")}
            />

            {/* KYC Upgrade Banner (Shown if not already Full KYC) */}
            {liveCard?.kycStatus !== "FULL_KYC" && (
              <KycBanner onCompleteKyc={() => navigate("/kyc")} />
            )}

            {/* Rewards: Cashback, Loyalty Points, Redeem Vouchers */}
            {launchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between shadow-2xs">
                <span>{launchError}</span>
                <button
                  type="button"
                  onClick={() => setLaunchError(null)}
                  className="text-red-400 hover:text-red-700 font-bold ml-2 transition-colors cursor-pointer"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}
            <RewardStats
              cashback={0}
              loyaltyPoints={hubbleHistoryData?.data?.currentBalance ?? 0}
              onRedeemVouchers={handleRedeemVouchers}
            />

            {/* Card Controls: PIN & Security */}
            <div id="card-controls-section">
              <CardControls
                maskedPan={liveCard?.maskedPan || undefined}
                holderName={user.name}
                onRefreshCard={refetchCard}
              />
            </div>
          </div>

          {/* Right Column: Courses, Transactions, Financial & Support (Max 760px) */}
          <div className="w-full max-w-[760px] flex flex-col gap-4">
            {/* Explore Upcoming Courses Banner */}
            <CoursesBanner />

            {/* Recent Transactions List */}
            <RecentTransactions
              transactions={transactionsList}
              onRefresh={handleRefreshActivity}
              isRefreshing={isHubbleHistoryFetching || isTransactionsFetching}
            />

            {/* Explore Financial Solutions */}
            <FinancialSolutions />

            {/* Help & Support Contact Cards */}
            <HelpSupport />
          </div>
        </div>
      </main>

      {/* Full KYC Upgraded Celebration Modal */}
      <KycUpgradedSuccessModal
        isOpen={showKycSuccessModal}
        newLimit={200000}
        onBackToDashboard={() => {
          setShowKycSuccessModal(false);
          navigate("/dashboard", { replace: true });
        }}
      />
    </div>
  );
};
