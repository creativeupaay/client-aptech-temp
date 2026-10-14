import { ApiError } from "../../utils/ApiError.js";

export interface TransbankErrorMapping {
  message: string;
  httpStatus: number;
  retryable: boolean;
}

/**
 * Central TransBnk / Oxymoney API status-code → user message + retry rule map (ERR-01).
 * Spec references: API Spec s4 / s4.2.
 */
const CODE_MAP: Record<number, TransbankErrorMapping> = {
  2020: {
    message: "Request is pending with the card gateway. Please wait.",
    httpStatus: 202,
    retryable: true,
  },
  4000: {
    message: "Invalid request. Please check the submitted details and try again.",
    httpStatus: 400,
    retryable: false,
  },
  4001: {
    message: "Not authorized to perform this card operation.",
    httpStatus: 403,
    retryable: false,
  },
  4011: {
    message: "Load money request was rejected by the card gateway.",
    httpStatus: 400,
    retryable: false,
  },
  4040: {
    message: "Requested card resource was not found on the gateway.",
    httpStatus: 404,
    retryable: false,
  },
  4160: {
    message: "Card operation failed due to a gateway validation error. Please try again later.",
    httpStatus: 400,
    retryable: true,
  },
  4162: {
    message: "Insufficient balance in merchant nodal account.",
    httpStatus: 400,
    retryable: false,
  },
  4164: {
    message: "Document identifier is already registered to another user profile.",
    httpStatus: 400,
    retryable: false,
  },
  4165: {
    message: "Mobile number is already registered on TransBnk.",
    httpStatus: 409,
    retryable: false,
  },
  4171: {
    message: "Verification blocked. Please wait before requesting another OTP.",
    httpStatus: 429,
    retryable: false,
  },
  4175: {
    message: "Load money status could not be confirmed. Please retry shortly.",
    httpStatus: 400,
    retryable: true,
  },
  4190: {
    message: "Load money request failed permanently. Please contact support if funds were deducted.",
    httpStatus: 400,
    retryable: false,
  },
  5000: {
    message: "Card gateway operation failed. Please try again later.",
    httpStatus: 400,
    retryable: true,
  },
};

const LOAD_COOLDOWN_MESSAGE = "Card loading is in cool down. Please try again later.";

export function getTransbankErrorMapping(
  code: number,
  gatewayMessage?: string | null,
  context?: { operation?: "load" | "otp" | "register" | "card" | "generic" }
): TransbankErrorMapping {
  const base = CODE_MAP[code] || {
    message: gatewayMessage || `TransBnk operation failed (Code: ${code})`,
    httpStatus: 400,
    retryable: false,
  };

  // LOD-06: cool-down specific copy for load operations on code 5000
  if (code === 5000 && context?.operation === "load") {
    const lower = (gatewayMessage || "").toLowerCase();
    if (!gatewayMessage || lower.includes("cool") || lower.includes("cooldown") || lower.includes("cool down")) {
      return { ...base, message: LOAD_COOLDOWN_MESSAGE, retryable: true };
    }
  }

  // Prefer gateway message when it is more specific and our map has a generic fallback
  if (gatewayMessage && code === 5000 && context?.operation !== "load") {
    return { ...base, message: gatewayMessage };
  }

  if (gatewayMessage && !CODE_MAP[code]) {
    return { ...base, message: gatewayMessage };
  }

  return base;
}

/**
 * Throws the appropriate ApiError for a TransBnk business status code.
 * Code 2020 must be handled by the caller as pending (not thrown).
 */
export function throwTransbankStatusError(
  code: number,
  gatewayMessage?: string | null,
  context?: { operation?: "load" | "otp" | "register" | "card" | "generic" }
): never {
  const mapped = getTransbankErrorMapping(code, gatewayMessage, context);

  if (mapped.httpStatus === 409) {
    throw ApiError.conflict(mapped.message);
  }
  if (mapped.httpStatus === 403) {
    throw ApiError.forbidden(mapped.message);
  }
  if (mapped.httpStatus === 404) {
    throw ApiError.notFound(mapped.message);
  }
  if (mapped.httpStatus === 429) {
    throw new ApiError(429, mapped.message);
  }

  throw ApiError.badRequest(mapped.message);
}

export function mapGatewayHttpError(status: number, message?: string | null): never {
  if (status === 403) {
    throw ApiError.forbidden(
      message ||
        "TransBnk access forbidden. Please verify API key and outbound IP whitelisting."
    );
  }
  if (status === 400) {
    throw ApiError.badRequest(message || "Invalid request body sent to TransBnk.");
  }
  if (status === 401) {
    throw ApiError.unauthorized(message || "IP not authorized or credentials rejected by TransBnk.");
  }
  throw ApiError.badGateway(`TransBnk HTTP error: ${status}`);
}
