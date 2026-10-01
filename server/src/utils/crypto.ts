import crypto from "node:crypto";
import { env } from "../env.config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const PREFIX = "enc:v1:";

/**
 * Derives a 32-byte key from the configured secret.
 */
function getEncryptionKey(): Buffer {
  const secret = env.ENCRYPTION_KEY || env.JWT_ACCESS_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptSensitive(plainText: string): string {
  if (!plainText || plainText.startsWith(PREFIX)) return plainText;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If the string does not have the enc:v1: prefix, returns it as-is for backward compatibility.
 */
export function decryptSensitive(cipherText: string): string {
  if (!cipherText || !cipherText.startsWith(PREFIX)) {
    return cipherText;
  }

  try {
    const raw = cipherText.slice(PREFIX.length);
    const [ivHex, authTagHex, encryptedHex] = raw.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
      return cipherText;
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.warn("[Crypto] Failed to decrypt sensitive field, returning masked fallback:", err);
    return cipherText;
  }
}
