import { env } from "../../../env.config.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { IProconnectService, ProconnectStudentProfile } from "../proconnect.interface.js";

export class HttpProconnectProvider implements IProconnectService {
  public async exchangeCode(code: string): Promise<ProconnectStudentProfile> {
    const endpoint = `${env.PROCONNECT_API_URL.replace(/\/+$/, "")}/token`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TBX-Client-Id": env.PROCONNECT_CLIENT_ID,
          "X-TBX-Client-Secret": env.PROCONNECT_CLIENT_SECRET,
        },
        body: JSON.stringify({ code }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      interface ProconnectApiResponse {
        success?: boolean;
        message?: string;
        data?: Partial<ProconnectStudentProfile>;
      }

      let json: ProconnectApiResponse;
      try {
        json = (await response.json()) as ProconnectApiResponse;
      } catch {
        throw new ApiError(
          response.status >= 400 && response.status < 500 ? response.status : 502,
          "Invalid or non-JSON response received from ProConnect SSO endpoint."
        );
      }

      if (!response.ok || !json.success || !json.data) {
        const errorMsg = json.message || "Failed to exchange authorization code with ProConnect.";
        throw new ApiError(response.status >= 400 && response.status < 500 ? response.status : 502, errorMsg);
      }

      const { studentId, name, mobile, email } = json.data;

      if (!studentId || !name || !mobile || !email) {
        throw new ApiError(502, "Incomplete student profile received from ProConnect SSO.");
      }

      return { studentId, name, mobile, email };
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError(504, "ProConnect SSO service timed out. Please try again.");
      }
      throw new ApiError(502, `ProConnect SSO connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  public async syncCardIssuance(input: import("../proconnect.interface.js").ProconnectCardSyncInput): Promise<void> {
    const endpoint = `${env.PROCONNECT_API_URL.replace(/\/+$/, "")}/cards/sync`;
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TBX-Client-Id": env.PROCONNECT_CLIENT_ID,
          "X-TBX-Client-Secret": env.PROCONNECT_CLIENT_SECRET,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.warn("[PROCONNECT] Card sync call failed, continuing gracefully:", err);
    }
  }

  public async syncRedemption(
    input: import("../proconnect.interface.js").ProconnectRedemptionSyncInput
  ): Promise<void> {
    const endpoint = `${env.PROCONNECT_API_URL.replace(/\/+$/, "")}/redemptions/sync`;
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TBX-Client-Id": env.PROCONNECT_CLIENT_ID,
          "X-TBX-Client-Secret": env.PROCONNECT_CLIENT_SECRET,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.warn("[PROCONNECT] Redemption sync call failed, continuing gracefully:", err);
    }
  }
}
