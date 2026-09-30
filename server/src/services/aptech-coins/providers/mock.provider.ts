import { ApiError } from "../../../utils/ApiError.js";
import type {
  IAptechCoinService,
  AptechCoinBalanceResult,
  AptechDebitInput,
  AptechDebitResult,
  AptechReverseInput,
  AptechReverseResult,
} from "../aptechCoin.interface.js";

export class MockAptechCoinProvider implements IAptechCoinService {
  private static instance: MockAptechCoinProvider | null = null;
  private balances = new Map<string, number>();
  private reversedTransactions = new Set<string>();

  public static getInstance(): MockAptechCoinProvider {
    if (!this.instance) {
      this.instance = new MockAptechCoinProvider();
    }
    return this.instance;
  }

  public reset(initialBalances?: Record<string, number>): void {
    this.balances.clear();
    this.reversedTransactions.clear();
    if (initialBalances) {
      for (const [k, v] of Object.entries(initialBalances)) {
        this.balances.set(k, v);
      }
    }
  }

  private getStudentBalance(studentId: string): number {
    if (!this.balances.has(studentId)) {
      this.balances.set(studentId, 500);
    }
    return this.balances.get(studentId)!;
  }

  public async getBalance(studentId: string): Promise<AptechCoinBalanceResult> {
    return {
      studentId,
      balance: this.getStudentBalance(studentId),
      currency: "POINTS",
    };
  }

  public async debitCoins(input: AptechDebitInput): Promise<AptechDebitResult> {
    const current = this.getStudentBalance(input.studentId);
    const amount = Number(input.amount);

    if (isNaN(amount) || amount <= 0) {
      throw ApiError.badRequest("Debit amount must be a positive number.");
    }

    if (current < amount) {
      throw ApiError.badRequest(
        `Insufficient loyalty points balance. Available: ${current}, Required: ${amount}.`
      );
    }

    const remaining = current - amount;
    this.balances.set(input.studentId, remaining);

    return {
      studentId: input.studentId,
      transactionId: input.transactionId || `APTECH_TXN_${Date.now()}`,
      referenceId: input.referenceId,
      debitedAmount: amount,
      remainingBalance: remaining,
      currency: "POINTS",
    };
  }

  public async reverseDebit(input: AptechReverseInput): Promise<AptechReverseResult> {
    const current = this.getStudentBalance(input.studentId);
    const amount = input.amount && input.amount > 0 ? Number(input.amount) : 1;
    const targetRef = input.originalTransactionId || input.transactionId;

    if (targetRef && this.reversedTransactions.has(targetRef)) {
      return {
        studentId: input.studentId,
        transactionId: `APTECH_REV_IDEM_${targetRef}`,
        originalTransactionId: targetRef,
        refundedAmount: 0,
        newBalance: current,
        currency: "POINTS",
      };
    }

    if (targetRef) {
      this.reversedTransactions.add(targetRef);
    }

    const newBal = current + amount;
    this.balances.set(input.studentId, newBal);

    return {
      studentId: input.studentId,
      transactionId: input.transactionId || `APTECH_REV_${Date.now()}`,
      originalTransactionId: targetRef,
      refundedAmount: amount,
      newBalance: newBal,
      currency: "POINTS",
    };
  }
}
