import { env } from "../../../env.config.js";
import { ApiError } from "../../../utils/ApiError.js";
import { CacheService } from "../../../utils/cache.js";
import type {
  IAptechCoinService,
  AptechCoinBalanceResult,
  AptechDebitInput,
  AptechDebitResult,
  AptechReverseInput,
  AptechReverseResult,
} from "../aptechCoin.interface.js";

export class HttpAptechCoinProvider implements IAptechCoinService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (env.APTECH_COIN_API_URL || "http://localhost:5175/api/v1/coins").replace(/\/+$/, "");
  }

  public async getBalance(studentId: string): Promise<AptechCoinBalanceResult> {
    const cacheKey = `coins:balance:${studentId}`;
    const cached = await CacheService.get<AptechCoinBalanceResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/balance?studentId=${encodeURIComponent(studentId)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
      });

      const json = await res.json() as {
        success?: boolean;
        message?: string;
        data?: { studentId: string; balance: number; currency: string };
      };

      if (!res.ok || !json.data) {
        throw new Error(json.message || `Failed to fetch balance from Aptech: ${res.statusText}`);
      }

      const balanceResult: AptechCoinBalanceResult = {
        studentId: json.data.studentId || studentId,
        balance: json.data.balance ?? 0,
        currency: json.data.currency || "POINTS",
      };

      // Cache balance for 30 seconds
      await CacheService.set(cacheKey, balanceResult, 30);

      return balanceResult;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw ApiError.gatewayTimeout("Aptech Coin API balance check timed out after 5000ms.");
      }
      throw ApiError.badGateway(`Aptech Coin API balance check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async debitCoins(input: AptechDebitInput): Promise<AptechDebitResult> {
    try {
      const url = `${this.baseUrl}/debit`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(5000),
      });

      const json = await res.json() as {
        success?: boolean;
        message?: string;
        data?: {
          studentId: string;
          transactionId: string;
          referenceId?: string;
          debitedAmount: number;
          remainingBalance: number;
          currency: string;
        };
      };

      if (!res.ok || !json.success || !json.data) {
        if (res.status === 400) {
          throw ApiError.badRequest(json.message || "Insufficient loyalty points balance at Aptech.");
        }
        throw new Error(json.message || `Failed to debit coins from Aptech: ${res.statusText}`);
      }

      // Smart Invalidation: Evict cached balance immediately upon debit
      await CacheService.del(`coins:balance:${input.studentId}`);

      return {
        studentId: json.data.studentId || input.studentId,
        transactionId: json.data.transactionId,
        referenceId: json.data.referenceId || input.referenceId,
        debitedAmount: json.data.debitedAmount,
        remainingBalance: json.data.remainingBalance,
        currency: json.data.currency || "POINTS",
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw ApiError.gatewayTimeout("Aptech Coin API debit timed out after 5000ms.");
      }
      throw ApiError.badGateway(`Aptech Coin API debit failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public async reverseDebit(input: AptechReverseInput): Promise<AptechReverseResult> {
    try {
      const url = `${this.baseUrl}/reverse`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(5000),
      });

      const json = await res.json() as {
        success?: boolean;
        message?: string;
        data?: {
          studentId: string;
          transactionId: string;
          originalTransactionId?: string;
          refundedAmount: number;
          newBalance: number;
          currency: string;
        };
      };

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || `Failed to reverse coins at Aptech: ${res.statusText}`);
      }

      // Smart Invalidation: Evict cached balance immediately upon reversal
      await CacheService.del(`coins:balance:${input.studentId}`);

      return {
        studentId: json.data.studentId || input.studentId,
        transactionId: json.data.transactionId,
        originalTransactionId: json.data.originalTransactionId || input.originalTransactionId,
        refundedAmount: json.data.refundedAmount,
        newBalance: json.data.newBalance,
        currency: json.data.currency || "POINTS",
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw ApiError.gatewayTimeout("Aptech Coin API reverse timed out after 5000ms.");
      }
      throw ApiError.badGateway(`Aptech Coin API reverse failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
