export interface AptechCoinBalanceResult {
  studentId: string;
  balance: number;
  currency: string;
}

export interface AptechDebitInput {
  studentId: string;
  amount: number;
  transactionId?: string;
  referenceId?: string;
  brandName?: string;
  orderId?: string;
}

export interface AptechDebitResult {
  studentId: string;
  transactionId: string;
  referenceId?: string;
  debitedAmount: number;
  remainingBalance: number;
  currency: string;
}

export interface AptechReverseInput {
  studentId: string;
  amount?: number;
  transactionId?: string;
  referenceId?: string;
  originalTransactionId?: string;
  reason?: string;
}

export interface AptechReverseResult {
  studentId: string;
  transactionId: string;
  originalTransactionId?: string;
  refundedAmount: number;
  newBalance: number;
  currency: string;
}

export interface IAptechCoinService {
  getBalance(studentId: string): Promise<AptechCoinBalanceResult>;
  debitCoins(input: AptechDebitInput): Promise<AptechDebitResult>;
  reverseDebit(input: AptechReverseInput): Promise<AptechReverseResult>;
}
