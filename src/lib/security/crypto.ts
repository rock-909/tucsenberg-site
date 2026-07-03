import {
  AES_KEY_LENGTH_BITS,
  COUNT_TWO,
  AES_GCM_IV_BYTES,
  HEX_RADIX,
  PBKDF2_ITERATIONS,
  ZERO,
} from "@/constants";

/**
 * 加密和密码哈希工具
 * Cryptography and password hashing utilities
 */

/**
 * Crypto constants
 */
const CRYPTO_CONSTANTS = {
  SALT_BYTE_LENGTH: HEX_RADIX,
  HEX_CHARS_PER_BYTE: COUNT_TWO,
  HEX_BASE: HEX_RADIX,
  HEX_PAD_LENGTH: COUNT_TWO,
} as const;

/**
 * Hash password using Web Crypto API
 */
export async function hashPassword(
  password: string,
  salt?: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const saltBytes = salt
    ? encoder.encode(salt)
    : crypto.getRandomValues(new Uint8Array(CRYPTO_CONSTANTS.SALT_BYTE_LENGTH));
  const passwordBytes = encoder.encode(password);

  const combined = new Uint8Array(saltBytes.length + passwordBytes.length);
  combined.set(saltBytes);
  combined.set(passwordBytes, saltBytes.length);

  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");

  const saltHex = Array.from(saltBytes)
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const [saltHex, expectedHash] = hash.split(":");
    if (!saltHex || !expectedHash) {
      return false;
    }

    const salt = (() => {
      const pairs: string[] = [];
      for (let i = 0; i < saltHex.length; i += COUNT_TWO) {
        const seg = saltHex.slice(i, i + COUNT_TWO);
        if (seg.length === COUNT_TWO) pairs.push(seg);
      }
      return pairs.map((byte) => parseInt(byte, HEX_RADIX));
    })();
    if (!salt) {
      return false;
    }

    const saltBytes = new Uint8Array(salt);
    const actualHash = await hashPassword(
      password,
      new TextDecoder().decode(saltBytes),
    );

    return actualHash === hash;
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(
  length: number = CRYPTO_CONSTANTS.SALT_BYTE_LENGTH,
): string {
  const saltBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(saltBytes)
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");
}

/**
 * Hash data using SHA-256
 */
export async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");
}

/**
 * Hash data using SHA-512
 */
export async function sha512Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-512", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");
}

/**
 * Generate HMAC signature
 */
export async function generateHMAC(
  data: string,
  secret: string,
  algorithm: "SHA-256" | "SHA-512" = "SHA-256",
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));

  return signatureArray
    .map((b) =>
      b
        .toString(CRYPTO_CONSTANTS.HEX_BASE)
        .padStart(CRYPTO_CONSTANTS.HEX_PAD_LENGTH, "0"),
    )
    .join("");
}

/**
 * Verify HMAC signature
 */
export async function verifyHMAC(params: {
  data: string;
  signature: string;
  secret: string;
  algorithm?: "SHA-256" | "SHA-512";
}): Promise<boolean> {
  try {
    const { data, signature, secret, algorithm = "SHA-256" } = params;
    const expectedSignature = await generateHMAC(data, secret, algorithm);
    return expectedSignature === signature;
  } catch {
    return false;
  }
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  data: string,
  password: string,
): Promise<{ encrypted: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(HEX_RADIX));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));

  // Derive key from password
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    false,
    ["encrypt"],
  );

  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataBytes,
  );

  return {
    encrypted: Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(HEX_RADIX).padStart(COUNT_TWO, "0"))
      .join(""),
    iv: Array.from(iv)
      .map((b) => b.toString(HEX_RADIX).padStart(COUNT_TWO, "0"))
      .join(""),
    salt: Array.from(salt)
      .map((b) => b.toString(HEX_RADIX).padStart(COUNT_TWO, "0"))
      .join(""),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(params: {
  encryptedHex: string;
  ivHex: string;
  saltHex: string;
  password: string;
}): Promise<string> {
  const { encryptedHex, ivHex, saltHex, password } = params;
  const encoder = new TextEncoder();

  // Convert hex strings back to bytes
  const encrypted = new Uint8Array(
    (() => {
      const out: number[] = [];
      for (let i = 0; i < encryptedHex.length; i += COUNT_TWO) {
        const seg = encryptedHex.slice(i, i + COUNT_TWO);
        if (seg.length === COUNT_TWO) out.push(parseInt(seg, HEX_RADIX));
      }
      return out;
    })(),
  );
  const iv = new Uint8Array(
    (() => {
      const out: number[] = [];
      for (let i = 0; i < ivHex.length; i += COUNT_TWO) {
        const seg = ivHex.slice(i, i + COUNT_TWO);
        if (seg.length === COUNT_TWO) out.push(parseInt(seg, HEX_RADIX));
      }
      return out;
    })(),
  );
  const salt = new Uint8Array(
    (() => {
      const out: number[] = [];
      for (let i = 0; i < saltHex.length; i += COUNT_TWO) {
        const seg = saltHex.slice(i, i + COUNT_TWO);
        if (seg.length === COUNT_TWO) out.push(parseInt(seg, HEX_RADIX));
      }
      return out;
    })(),
  );

  // Derive key from password
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    false,
    ["decrypt"],
  );

  // Decrypt data
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generate a secure random key for encryption
 */
export function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Export encryption key to raw format
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(HEX_RADIX).padStart(COUNT_TWO, "0"))
    .join("");
}

/**
 * Import encryption key from raw format
 */
export function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(
    (() => {
      const out: number[] = [];
      for (let i = 0; i < keyHex.length; i += COUNT_TWO) {
        const seg = keyHex.slice(i, i + COUNT_TWO);
        if (seg.length === COUNT_TWO) out.push(parseInt(seg, HEX_RADIX));
      }
      return out;
    })(),
  );

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares strings without leaking length information through timing.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // Use the longer length to prevent length-based timing attacks
  const maxLength = Math.max(a.length, b.length);

  // Track both XOR result and length mismatch
  let result = a.length ^ b.length;

  for (let i = ZERO; i < maxLength; i++) {
    // Use 0 as fallback for out-of-bounds access to maintain constant time
    const charA = i < a.length ? a.charCodeAt(i) : ZERO;
    const charB = i < b.length ? b.charCodeAt(i) : ZERO;
    result |= charA ^ charB;
  }

  return result === ZERO;
}
