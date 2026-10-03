export interface ProconnectStudentProfile {
  studentId: string;
  name: string;
  mobile: string;
  email: string;
}

export interface ProconnectCardSyncInput {
  studentId: string;
  mobileNumber: string;
  emailId: string;
  cardStatus: "ACTIVE" | "APPLICATION_PENDING" | "REJECTED";
  last4Digits?: string;
  merchantTransactionId?: string;
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
   * Optional helper (primarily for mock/dev) to generate a simulated authorization code.
   */
  generateMockCode?(profile?: Partial<ProconnectStudentProfile>): Promise<string>;
}

