import type { CardStatus } from "./card.model.js";

/** Portal / ProConnect card status vocabulary (FSD s4 / s6). */
export type PortalCardStatus = "Issued" | "Not Issued" | "Pending" | "Rejected";

/**
 * Maps internal TBX card lifecycle status to portal labels for UI and ProConnect sync.
 */
export function toPortalCardStatus(status: CardStatus | string): PortalCardStatus {
  switch (status) {
    case "ACTIVE":
    case "ISSUED":
    case "FROZEN":
    case "BLOCKED":
      return "Issued";
    case "APPLICATION_PENDING":
      return "Pending";
    case "REJECTED":
      return "Rejected";
    case "NOT_APPLIED":
    default:
      return "Not Issued";
  }
}

export function isCardIssuedStatus(status: CardStatus | string): boolean {
  return status === "ACTIVE" || status === "ISSUED" || status === "FROZEN" || status === "BLOCKED";
}

export function isCardPendingStatus(status: CardStatus | string): boolean {
  return status === "APPLICATION_PENDING";
}

/**
 * Extract last 4 digits from a masked PAN. Returns undefined if unknown
 * (never invents a fake last4 for outbound sync).
 */
export function extractLast4(maskedPan?: string | null): string | undefined {
  if (!maskedPan) return undefined;
  const digits = maskedPan.replace(/\D/g, "");
  if (digits.length < 4) return undefined;
  return digits.slice(-4);
}
