import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";
import { env } from "../env";

const ALGORITHM = "aes-256-gcm";
const SALT = "vibeforge-settings-v1"; // static app-layer salt
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Derive encryption key from BETTER_AUTH_SECRET
let derivedKey: Buffer | null = null;
function getKey(): Buffer {
  if (!derivedKey) {
    derivedKey = pbkdf2Sync(env.BETTER_AUTH_SECRET, SALT, 100_000, KEY_LENGTH, "sha256");
  }
  return derivedKey;
}

// Sensitive key patterns
const SENSITIVE_PATTERNS = ["key", "secret", "token", "password"];

export function isSensitiveKey(keyName: string): boolean {
  const lower = keyName.toLowerCase();
  return SENSITIVE_PATTERNS.some(p => lower.includes(p));
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: base64(iv + tag + ciphertext)
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedB64: string): string {
  try {
    const key = getKey();
    const data = Buffer.from(encryptedB64, "base64");
    if (data.length < IV_LENGTH + TAG_LENGTH) return encryptedB64; // Not encrypted (legacy)

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  } catch {
    // Decryption failed — likely legacy plain-text value
    return encryptedB64;
  }
}
