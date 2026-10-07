import { ApiError } from "../../../utils/ApiError.js";
import type {
  ITransbankProvider,
  TransbankCardCreateInput,
  TransbankCardCreateResult,
  TransbankCardCreationStatusInput,
  TransbankCardCreationStatusResult,
  TransbankFullKycUrlInput,
  TransbankFullKycUrlResult,
  TransbankGprLoadInput,
  TransbankGprLoadResult,
  TransbankLoadMoneyStatusInput,
  TransbankLoadMoneyStatusResult,
  TransbankRegisterInput,
  TransbankRegisterResult,
  TransbankSendOtpInput,
  TransbankSendOtpResult,
} from "../transbank.interface.js";

interface TransbankEnvelope<T = unknown> {
  status?: {
    code: number;
    message: string | null;
  };
  result?: T;
  message?: string;
}

export class HttpTransbankProvider implements ITransbankProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly clientId: string;
  private readonly username: string;
  private readonly clientPassword: string;

  constructor(config: {
    baseUrl: string;
    apiKey: string;
    clientId: string;
    username: string;
    clientPassword: string;
  }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.clientId = config.clientId;
    this.username = config.username;
    this.clientPassword = config.clientPassword;
  }

  /**
   * Sanitizes strings to comply with TransBnk API Gateway Special Characters Policy.
   * Strips/replaces <, >, {, }, [, ], ~, $, %, ^ with a space.
   */
  private sanitize<T>(data: T): T {
    if (typeof data === "string") {
      return data.replace(/[<>{}[\]~$%^]/g, " ") as unknown as T;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as unknown as T;
    }
    if (data !== null && typeof data === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitizedObj[key] = this.sanitize(value);
      }
      return sanitizedObj as T;
    }
    return data;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "x-client-id": this.clientId,
      "x-username": this.username,
      "x-client-password": this.clientPassword,
    };
  }

  private async post<TReq, TRes>(path: string, payload: TReq): Promise<TRes> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const sanitizedPayload = this.sanitize(payload);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(sanitizedPayload),
        signal: AbortSignal.timeout(30000),
      });

      const responseText = await response.text();
      let json: TransbankEnvelope<TRes>;
      try {
        json = JSON.parse(responseText) as TransbankEnvelope<TRes>;
      } catch {
        throw ApiError.badGateway(
          `TransBnk returned non-JSON response (HTTP ${response.status} ${response.statusText}): ${responseText.slice(
            0,
            200
          )}`
        );
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw ApiError.forbidden(
            json.message ||
              "TransBnk access forbidden. Please verify API key and outbound IP whitelisting."
          );
        }
        if (response.status === 400) {
          throw ApiError.badRequest(json.message || "Invalid payload sent to TransBnk.");
        }
        throw ApiError.badGateway(
          `TransBnk HTTP error: ${response.status} ${response.statusText}`
        );
      }

      if (json.status && json.status.code !== 2000) {
        // Status code 2020 signifies "Pending / In-Progress" on TransBnk (TransBnk API Spec Sec 6.2)
        if (json.status.code === 2020) {
          return (json.result !== undefined ? json.result : (json as unknown)) as TRes;
        }

        const errorMsg = json.status.message || `TransBnk operation failed (Code: ${json.status.code})`;
        if (json.status.code === 4165) {
          throw ApiError.conflict("Mobile number is already registered on TransBnk.");
        }
        if (json.status.code === 4164) {
          throw ApiError.badRequest("Document identifier is already registered to another user profile.");
        }
        if (json.status.code === 4162) {
          throw ApiError.badRequest("Insufficient balance in merchant nodal account.");
        }
        if (json.status.code === 5000) {
          throw ApiError.badRequest(errorMsg);
        }
        throw ApiError.badRequest(errorMsg);
      }

      return (json.result !== undefined ? json.result : (json as unknown)) as TRes;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw ApiError.gatewayTimeout("TransBnk API request timed out after 30000ms.");
      }
      throw ApiError.badGateway(
        `Failed to communicate with TransBnk Banking Gateway: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  public async sendCustomerOtp(input: TransbankSendOtpInput): Promise<TransbankSendOtpResult> {
    const res = await this.post<TransbankSendOtpInput, { message: string }>("/customer-otp", input);
    return {
      message: res.message || "OTP sent successfully",
    };
  }

  public async registerCustomer(input: TransbankRegisterInput): Promise<TransbankRegisterResult> {
    interface ApiRegisterResult {
      sender_tag: string;
      message: string;
    }
    const res = await this.post<TransbankRegisterInput, ApiRegisterResult>(
      "/customer-register",
      {
        ...input,
        context: input.context || {},
      }
    );
    return {
      senderTag: res.sender_tag,
      message: res.message || "Customer registered successfully.",
    };
  }

  public async getFullKycUrl(input: TransbankFullKycUrlInput): Promise<TransbankFullKycUrlResult> {
    interface ApiKycResult {
      expire_on?: string;
      kyc_required?: boolean | string;
      taxation_required?: boolean | string;
      url?: string;
    }
    const res = await this.post<{ senderId: string }, ApiKycResult>("/full-kyc-url", {
      senderId: input.senderId,
    });

    // Gateway returns "false" / "true" as strings or booleans; normalize strictly to boolean
    const isKycRequired =
      res?.kyc_required === true || res?.kyc_required === "true";
    const isTaxationRequired =
      res?.taxation_required === true || res?.taxation_required === "true";

    return {
      url: res?.url || "",
      expireOn: res?.expire_on,
      kycRequired: isKycRequired,
      taxationRequired: isTaxationRequired,
    };
  }

  public async createCard(input: TransbankCardCreateInput): Promise<TransbankCardCreateResult> {
    interface ApiCardCreateResult {
      reference_id: string;
      is_otp_required: boolean;
      message: string;
      card_id: string;
      status: "SUBMITTED" | "SUCCESS" | "NONE" | "FAILED";
    }
    const res = await this.post<TransbankCardCreateInput, ApiCardCreateResult>("/card-create", {
      senderTag: input.senderTag,
      cardFormFactor: input.cardFormFactor || "VIRTUAL",
      cardType: input.cardType || "GPR",
      amount: input.amount || "0.00",
      context: input.context || {},
    });
    return {
      referenceId: res.reference_id,
      isOtpRequired: res.is_otp_required,
      cardId: res.card_id,
      status: res.status,
      message: res.message,
    };
  }

  public async getCardCreationStatus(
    input: TransbankCardCreationStatusInput
  ): Promise<TransbankCardCreationStatusResult> {
    interface ApiCardStatusResult {
      reference_id?: string;
      is_otp_required?: boolean;
      message?: string;
      card_id?: string;
      status?: "SUBMITTED" | "SUCCESS" | "FAILED";
      maskedPan?: string;
    }
    const res = await this.post<TransbankCardCreationStatusInput, ApiCardStatusResult>(
      "/card-creation-status",
      input
    );
    return {
      referenceId: res?.reference_id || input.referenceId,
      isOtpRequired: Boolean(res?.is_otp_required),
      cardId: res?.card_id || "",
      status: res?.status || "SUBMITTED",
      message: res?.message || (res?.status === "SUCCESS" ? "Card created successfully." : "Card creation in progress."),
      maskedPan: res?.maskedPan,
    };
  }

  public async loadGprCard(input: TransbankGprLoadInput): Promise<TransbankGprLoadResult> {
    const res = await this.post<TransbankGprLoadInput, number>("/card-gpr-load", input);
    return {
      referenceId: res,
    };
  }

  public async getLoadMoneyStatus(
    input: TransbankLoadMoneyStatusInput
  ): Promise<TransbankLoadMoneyStatusResult> {
    interface ApiLoadMoneyResult {
      txn_id: string;
      status: "SUCCESS" | "SUBMITTED" | "FAILED";
      message: string;
    }
    const res = await this.post<TransbankLoadMoneyStatusInput, ApiLoadMoneyResult>(
      "/card-load-money-status",
      input
    );
    return {
      txnId: res.txn_id,
      status: res.status,
      message: res.message,
    };
  }

  private cachedClientToken: { token: string; expiresAt: number } | null = null;

  /**
   * Exchanges client credentials for a short-lived OAuth2 Bearer token (clientToken)
   * used by @oxymoney/cardsdk-web. Caches token in memory based on returned expires_in.
   */
  public async getClientToken(): Promise<string> {
    if (this.cachedClientToken && Date.now() < this.cachedClientToken.expiresAt) {
      return this.cachedClientToken.token;
    }

    const tokenUrl = "https://carduat.oxymoney.com/authserver/oauth/token";
    const credentials = Buffer.from(`${this.clientId}:${this.clientPassword}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "password",
      username: this.username,
      password: this.clientPassword,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[TransbankProvider] Failed OAuth token response (HTTP ${response.status}):`, errText);
        // Fallback to clientPassword if authserver fails
        return this.clientPassword;
      }

      const data = (await response.json()) as { access_token: string; expires_in?: number };
      const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600;

      // Cache token, expiring 60s early for safety
      this.cachedClientToken = {
        token: data.access_token,
        expiresAt: Date.now() + Math.max(0, expiresInSec - 60) * 1000,
      };

      return data.access_token;
    } catch (err: any) {
      console.error("[TransbankProvider] getClientToken network error:", err.message);
      return this.clientPassword;
    }
  }
}
