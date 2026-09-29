export interface Transaction {
  id: string;
  title: string;
  date: string;
  points: number;
  amount: number;
  type: "DR" | "CR";
}

export interface DashboardData {
  user: {
    name: string;
    studentId: string;
    initials: string;
  };
  card: {
    holderName: string;
    maskedPan: string;
    expiry: string;
    cvv: string;
    usedAmount: number;
    totalLimit: number;
    availableBalance: number;
    isCardEnabled: boolean;
    isCardLocked: boolean;
  };
  rewards: {
    cashback: number;
    loyaltyPoints: number;
  };
  transactions: Transaction[];
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  user: {
    name: "Aarav Sharma",
    studentId: "APT-2026-00417",
    initials: "AS",
  },
  card: {
    holderName: "Aarav Sharma",
    maskedPan: "•••• •••• •••• ••••",
    expiry: "••/••",
    cvv: "•••",
    usedAmount: 3000,
    totalLimit: 10000,
    availableBalance: 7000,
    isCardEnabled: true,
    isCardLocked: false,
  },
  rewards: {
    cashback: 42,
    loyaltyPoints: 315,
  },
  transactions: [
    {
      id: "tx-1",
      title: "Data Science with Python",
      date: "05 Sep 2026, 2:30 PM",
      points: 150,
      amount: 1599,
      type: "DR",
    },
    {
      id: "tx-2",
      title: "Cashback earned",
      date: "05 Sep 2026, 2:31 PM",
      points: 42,
      amount: 42,
      type: "CR",
    },
    {
      id: "tx-3",
      title: "UI/UX Design Masterclass",
      date: "04 Sep 2026, 11:15 AM",
      points: 300,
      amount: 2999,
      type: "DR",
    },
    {
      id: "tx-4",
      title: "Digital Marketing Fundamentals",
      date: "03 Sep 2026, 9:40 AM",
      points: 80,
      amount: 799,
      type: "DR",
    },
    {
      id: "tx-5",
      title: "Java Programming Bootcamp",
      date: "02 Sep 2026, 6:05 PM",
      points: 130,
      amount: 1299,
      type: "DR",
    },
    {
      id: "tx-6",
      title: "Excel for Data Analysis",
      date: "01 Sep 2026, 10:20 AM",
      points: 50,
      amount: 499,
      type: "DR",
    },
  ],
};
