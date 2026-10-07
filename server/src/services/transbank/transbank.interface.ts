export type TransbankDocumentType =
  | "AADHAR_NUMBER"
  | "DRIVING_LICENCE"
  | "PASSPORT_NUMBER"
  | "VOTER_ID";

export interface TransbankSendOtpInput {
  mobile: string;
}

export interface TransbankSendOtpResult {
  message: string;
}

export interface TransbankRegisterInput {
  name: string;
  mobile: string;
  email: string;
  documentType: TransbankDocumentType;
  documentValue: string;
  dateOfBirth?: string;
  otp: string;
  context?: Record<string, unknown>;
}

export interface TransbankRegisterResult {
  senderTag: string;
  message: string;
}

export interface TransbankFullKycUrlInput {
  senderId: string;
}

export interface TransbankFullKycUrlResult {
  url: string;
  expireOn?: string;
  kycRequired: boolean;
  taxationRequired: boolean | string;
}

export interface TransbankCardCreateInput {
  senderTag: string;
  cardFormFactor?: "VIRTUAL" | "PHYSICAL";
  cardType?: "GPR" | "GC";
  amount?: string;
  context?: Record<string, unknown>;
}

export interface TransbankCardCreateResult {
  referenceId: string;
  isOtpRequired: boolean;
  cardId: string;
  status: "SUBMITTED" | "SUCCESS" | "NONE" | "FAILED";
  message: string;
}

export interface TransbankCardCreationStatusInput {
  referenceId: string;
  senderTag: string;
}

export interface TransbankCardCreationStatusResult {
  referenceId: string;
  isOtpRequired: boolean;
  cardId: string;
  status: "SUBMITTED" | "SUCCESS" | "FAILED";
  message: string;
  maskedPan?: string;
}

export interface TransbankGprLoadInput {
  cardId: string;
  amount: string; // e.g. "500.00"
}

export interface TransbankGprLoadResult {
  referenceId: number;
}

export interface TransbankLoadMoneyStatusInput {
  referenceId: string;
}

export interface TransbankLoadMoneyStatusResult {
  txnId: string;
  status: "SUCCESS" | "SUBMITTED" | "FAILED";
  message: string;
}

export interface ITransbankProvider {
  /** API 1: Generate SMS OTP for mobile verification */
  sendCustomerOtp(input: TransbankSendOtpInput): Promise<TransbankSendOtpResult>;

  /** API 2: Register customer & Min KYC to acquire senderTag */
  registerCustomer(input: TransbankRegisterInput): Promise<TransbankRegisterResult>;

  /** API 3: Generate redirect URL for Aadhaar biometric/OTP e-KYC and PAN */
  getFullKycUrl(input: TransbankFullKycUrlInput): Promise<TransbankFullKycUrlResult>;

  /** API 4: Asynchronously trigger virtual GPR prepaid card issuance */
  createCard(input: TransbankCardCreateInput): Promise<TransbankCardCreateResult>;

  /** API 5: Poll card creation status to obtain permanent cardId */
  getCardCreationStatus(
    input: TransbankCardCreationStatusInput
  ): Promise<TransbankCardCreationStatusResult>;

  /** API 6: Load money to GPR prepaid card wallet */
  loadGprCard(input: TransbankGprLoadInput): Promise<TransbankGprLoadResult>;

  /** API 7: Verify load money transaction status & bank txnId */
  getLoadMoneyStatus(
    input: TransbankLoadMoneyStatusInput
  ): Promise<TransbankLoadMoneyStatusResult>;

  /** Exchange merchant credentials for short-lived OAuth2 clientToken for CardSDK */
  getClientToken(): Promise<string>;

  /** Optional helper (primarily for mock/dev) to simulate completion of Full KYC on the gateway */
  simulateKycCompletion?(senderId: string): void;
}
