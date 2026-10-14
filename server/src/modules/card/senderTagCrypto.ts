import { encryptSensitive, decryptSensitive } from "../../utils/crypto.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Encrypts sender_tag for at-rest storage (SEC-01).
 * Idempotent if already encrypted.
 */
export function setSenderTagEncrypted(plainOrEncrypted: string): string {
  return encryptSensitive(plainOrEncrypted);
}

/**
 * Returns plaintext sender_tag for TransBnk API calls.
 * Passes through legacy plaintext UUIDs for backward compatibility.
 */
export function getSenderTagPlain(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const plain = decryptSensitive(stored);
  return plain || null;
}

export function looksLikePlainSenderTag(value: string): boolean {
  return UUID_RE.test(value.trim());
}
