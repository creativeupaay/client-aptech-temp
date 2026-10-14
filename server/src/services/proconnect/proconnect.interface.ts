export interface ProconnectStudentProfile {
  studentId: string;
  name: string;
  mobile: string;
  email: string;
}

export type ProconnectPortalCardStatus = "Issued" | "Not Issued" | "Pending" | "Rejected";

export interface ProconnectCardSyncInput {
  studentId: string;
  mobileNumber: string;
  emailId: string;
  cardStatus: ProconnectPortalCardStatus;
  cardId?: string;
  last4Digits?: string;
  merchantTransactionId?: string;
  timestamp?: string;
}

export interface ProconnectRedemptionSyncInput {
  studentId: string;
  orderId: string;
  pointsSpent: number;
  remainingBalance: number;
  voucherName?: string;
  timestamp?: string;
}

export interface IProconnectService {
  /**
   * Exchanges an opaque, single-use authorization code for the authenticated student profile.
   * Throws ApiError if code is invalid, expired, or already used.
   */
  exchangeCode(code: string): Promise<ProconnectStudentProfile>;

  /**
   * Synchronizes newly issued student card details back to ProConnect & ApTrack ecosystem.
   * Mandated by Functional Spec Section 6 (TBX -> ProConnect).
   */
  syncCardIssuance(input: ProconnectCardSyncInput): Promise<void>;

  /**
   * Synchronizes voucher redemption outcome and remaining loyalty balance to ProConnect (RWD-08).
   */
  syncRedemption(input: ProconnectRedemptionSyncInput): Promise<void>;

  /**
   * Optional helper (primarily for mock/dev) to generate a simulated authorization code.
   */
  generateMockCode?(profile?: Partial<ProconnectStudentProfile>): Promise<string>;
}

