import { useRef, useCallback } from "react";
import { CardSDK, type SDKError } from "@oxymoney/cardsdk-web";
import { useGetCardSdkSessionQuery } from "../cardApi";

export interface LaunchSdkOptions {
  cardId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

// Global reference to active SDK instance and mobile for secure in-memory session tracking
let activeSdkInstance: CardSDK | null = null;
let activeSdkMobile: string | null = null;

export const clearCardSdkSession = () => {
  if (activeSdkInstance) {
    try {
      activeSdkInstance.clearSession();
    } catch (e) {
      console.warn("[CardSDK] Error clearing session:", e);
    }
    activeSdkInstance = null;
  }
  activeSdkMobile = null;
  // Purge any storage keys left by third-party CardSDK iframe
  try {
    sessionStorage.removeItem("cardsdk_session_token");
    sessionStorage.removeItem("OXYMONEY_TOKEN");
    sessionStorage.removeItem("OXYMONEY_USER_NUMBER");
    sessionStorage.removeItem("OXYMONEY_LOGGED_IN");
  } catch {
    // Ignore storage access errors
  }
};

export interface SdkErrorInfo {
  code: string;
  message: string;
  isUserDismissal: boolean;
}

export const normalizeSdkErrorMessage = (err: unknown): SdkErrorInfo => {
  if (typeof err === "object" && err !== null && "code" in err) {
    const sdkErr = err as SDKError;

    switch (sdkErr.code) {
      case "AUTH_CANCELLED":
        return {
          code: sdkErr.code,
          message: "Authentication was dismissed by user.",
          isUserDismissal: true,
        };
      case "OTP_VERIFY_FAILED":
        return {
          code: sdkErr.code,
          message: "Invalid or expired verification OTP. Please try again.",
          isUserDismissal: false,
        };
      case "OTP_GENERATE_FAILED":
        return {
          code: sdkErr.code,
          message: "Could not send verification OTP to your mobile number. Please retry.",
          isUserDismissal: false,
        };
      case "NETWORK_ERROR":
        return {
          code: sdkErr.code,
          message: "Network error: Unable to reach Card Gateway. Please check your connection.",
          isUserDismissal: false,
        };
      case "REQUEST_TIMEOUT":
        return {
          code: sdkErr.code,
          message: "Card Gateway request timed out. Please try again in a moment.",
          isUserDismissal: false,
        };
      case "INTEGRITY_VIOLATION":
        return {
          code: sdkErr.code,
          message: "Security Alert: Native browser functions were modified. Access blocked.",
          isUserDismissal: false,
        };
      case "MISSING_TOKEN":
      case "TOKEN_TOO_SHORT":
      case "TOKEN_TOO_LONG":
        return {
          code: sdkErr.code,
          message: "Card SDK session authentication failed. Please reload and log in again.",
          isUserDismissal: false,
        };
      default:
        return {
          code: sdkErr.code,
          message: sdkErr.message || "An unexpected Card SDK error occurred.",
          isUserDismissal: false,
        };
    }
  }

  return {
    code: "UNKNOWN_ERROR",
    message: err instanceof Error ? err.message : "Failed to open official Card SDK.",
    isUserDismissal: false,
  };
};

export const useCardSdk = () => {
  const { refetch: refetchSession } = useGetCardSdkSessionQuery();
  const sdkInstanceRef = useRef<CardSDK | null>(null);

  const getSdkInstance = useCallback(
    (
      clientId: string,
      clientToken: string,
      environment?: string,
      customOnError?: (error: SDKError) => void
    ) => {
      if (
        !sdkInstanceRef.current ||
        (sdkInstanceRef.current as any).config?.clientId !== clientId ||
        (sdkInstanceRef.current as any).config?.clientToken !== clientToken
      ) {
        if (sdkInstanceRef.current) {
          try {
            sdkInstanceRef.current.clearSession();
          } catch {
            // ignore
          }
        }

        const instance = new CardSDK({
          clientId,
          clientToken,
          environment: environment === "production" ? "production" : "sandbox",
          theme: {
            primaryColor: "#DB6516", // Aptech Orange
            secondaryColor: "#1C1C21", // Aptech Charcoal
            accentColor: "#FDF0E7",
          },
          onError: (err: SDKError) => {
            const normalized = normalizeSdkErrorMessage(err);
            if (!normalized.isUserDismissal) {
              console.error(`[CardSDK Error] [${err.code}]:`, err.message);
            }
            customOnError?.(err);
          },
        });
        sdkInstanceRef.current = instance;
        activeSdkInstance = instance;
      }
      return sdkInstanceRef.current;
    },
    []
  );

  const launchSdk = useCallback(
    async (options?: LaunchSdkOptions) => {
      try {
        const sessionRes = await refetchSession();
        const session = sessionRes.data?.data;

        if (!session?.clientId || !session?.clientToken || !session?.mobileNumber) {
          throw new Error("Card SDK session credentials not available.");
        }

        // Verify in-memory mobile state rather than reading from unencrypted sessionStorage
        if (activeSdkMobile && activeSdkMobile !== session.mobileNumber) {
          clearCardSdkSession();
        }
        activeSdkMobile = session.mobileNumber;

        const effectiveCardId = options?.cardId || session.cardId || undefined;

        const sdk = getSdkInstance(
          session.clientId,
          session.clientToken,
          session.environment,
          (sdkErr) => options?.onError?.(sdkErr)
        );

        await sdk.start({
          mobileNumber: session.mobileNumber,
          cardId: effectiveCardId,
          onClose: options?.onClose,
        });

        options?.onSuccess?.();
      } catch (err: unknown) {
        const normalized = normalizeSdkErrorMessage(err);
        if (normalized.isUserDismissal) {
          // Clean exit on modal dismissal without throwing to outer handler
          options?.onClose?.();
          return;
        }

        console.error("[CardSDK] Initialization error:", err);
        options?.onError?.(err);
        throw new Error(normalized.message);
      }
    },
    [getSdkInstance, refetchSession]
  );

  const clearSession = useCallback(() => {
    clearCardSdkSession();
    sdkInstanceRef.current = null;
  }, []);

  return { launchSdk, clearSession };
};
