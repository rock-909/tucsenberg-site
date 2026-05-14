import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  constantTimeCompare,
  decryptData,
  encryptData,
  exportKey,
  generateEncryptionKey,
  generateHMAC,
  generateSalt,
  hashPassword,
  importKey,
  sha256Hash,
  sha512Hash,
  verifyHMAC,
  verifyPassword,
} from "@/lib/security/crypto";

describe("security-crypto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash password with auto-generated salt", async () => {
      const hash = await hashPassword("testPassword123");

      expect(hash).toBeDefined();
      expect(hash).toContain(":");

      const [saltHex, hashHex] = hash.split(":");
      expect(saltHex!.length).toBe(32); // 16 bytes = 32 hex chars
      expect(hashHex!.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it("should hash password with provided salt", async () => {
      const salt = "customSalt123456";
      const hash = await hashPassword("testPassword", salt);

      expect(hash).toBeDefined();
      expect(hash).toContain(":");
    });

    it("should produce different hashes for different passwords", async () => {
      const hash1 = await hashPassword("password1", "sameSalt12345678");
      const hash2 = await hashPassword("password2", "sameSalt12345678");

      expect(hash1).not.toBe(hash2);
    });

    it("should produce same hash for same password and salt", async () => {
      const salt = "consistentSalt16";
      const hash1 = await hashPassword("samePassword", salt);
      const hash2 = await hashPassword("samePassword", salt);

      expect(hash1).toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password, "testSalt12345678");

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const hash = await hashPassword("correctPassword", "testSalt12345678");

      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should return false for invalid hash format (no colon)", async () => {
      const isValid = await verifyPassword("password", "invalidhashformat");
      expect(isValid).toBe(false);
    });

    it("should return false for empty salt in hash", async () => {
      const isValid = await verifyPassword("password", ":somehash");
      expect(isValid).toBe(false);
    });

    it("should return false for empty hash part", async () => {
      const isValid = await verifyPassword("password", "somesalt:");
      expect(isValid).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const isValid = await verifyPassword("password", "");
      expect(isValid).toBe(false);
    });
  });

  describe("generateSalt", () => {
    it("should generate salt with default length", () => {
      const salt = generateSalt();
      expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("should generate salt with custom length", () => {
      const salt = generateSalt(8);
      expect(salt.length).toBe(16); // 8 bytes = 16 hex chars
    });

    it("should generate different salts each time", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      expect(salt1).not.toBe(salt2);
    });

    it("should generate valid hex string", () => {
      const salt = generateSalt();
      expect(/^[0-9a-f]+$/i.test(salt)).toBe(true);
    });
  });

  describe("sha256Hash", () => {
    it("should hash data using SHA-256", async () => {
      const hash = await sha256Hash("test data");

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it("should produce consistent hash for same input", async () => {
      const hash1 = await sha256Hash("consistent data");
      const hash2 = await sha256Hash("consistent data");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await sha256Hash("data1");
      const hash2 = await sha256Hash("data2");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await sha256Hash("");
      expect(hash.length).toBe(64);
    });
  });

  describe("sha512Hash", () => {
    it("should hash data using SHA-512", async () => {
      const hash = await sha512Hash("test data");

      expect(hash).toBeDefined();
      expect(hash.length).toBe(128); // SHA-512 = 128 hex chars
    });

    it("should produce consistent hash for same input", async () => {
      const hash1 = await sha512Hash("consistent data");
      const hash2 = await sha512Hash("consistent data");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await sha512Hash("data1");
      const hash2 = await sha512Hash("data2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateHMAC", () => {
    it("should generate HMAC with SHA-256 by default", async () => {
      const hmac = await generateHMAC("data", "secret");

      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(64); // SHA-256 HMAC = 64 hex chars
    });

    it("should generate HMAC with SHA-512", async () => {
      const hmac = await generateHMAC("data", "secret", "SHA-512");

      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(128); // SHA-512 HMAC = 128 hex chars
    });

    it("should produce consistent HMAC for same inputs", async () => {
      const hmac1 = await generateHMAC("data", "secret");
      const hmac2 = await generateHMAC("data", "secret");

      expect(hmac1).toBe(hmac2);
    });

    it("should produce different HMAC for different data", async () => {
      const hmac1 = await generateHMAC("data1", "secret");
      const hmac2 = await generateHMAC("data2", "secret");

      expect(hmac1).not.toBe(hmac2);
    });

    it("should produce different HMAC for different secrets", async () => {
      const hmac1 = await generateHMAC("data", "secret1");
      const hmac2 = await generateHMAC("data", "secret2");

      expect(hmac1).not.toBe(hmac2);
    });
  });

  describe("verifyHMAC", () => {
    it("should verify valid HMAC signature", async () => {
      const data = "test data";
      const secret = "test secret";
      const signature = await generateHMAC(data, secret);

      const isValid = await verifyHMAC({ data, signature, secret });
      expect(isValid).toBe(true);
    });

    it("should reject invalid HMAC signature", async () => {
      const isValid = await verifyHMAC({
        data: "test data",
        signature: "invalidsignature",
        secret: "test secret",
      });

      expect(isValid).toBe(false);
    });

    it("should verify HMAC with SHA-512 algorithm", async () => {
      const data = "test data";
      const secret = "test secret";
      const signature = await generateHMAC(data, secret, "SHA-512");

      const isValid = await verifyHMAC({
        data,
        signature,
        secret,
        algorithm: "SHA-512",
      });

      expect(isValid).toBe(true);
    });

    it("should reject when algorithm mismatch", async () => {
      const data = "test data";
      const secret = "test secret";
      const signature = await generateHMAC(data, secret, "SHA-256");

      const isValid = await verifyHMAC({
        data,
        signature,
        secret,
        algorithm: "SHA-512",
      });

      expect(isValid).toBe(false);
    });
  });

  describe("encryptData / decryptData", () => {
    it("should encrypt and decrypt data successfully", async () => {
      const originalData = "sensitive information";
      const password = "strongPassword123";

      const { encrypted, iv, salt } = await encryptData(originalData, password);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(salt).toBeDefined();

      const decrypted = await decryptData({
        encryptedHex: encrypted,
        ivHex: iv,
        saltHex: salt,
        password,
      });

      expect(decrypted).toBe(originalData);
    });

    it("should produce different ciphertext for same plaintext", async () => {
      const data = "same data";
      const password = "password123";

      const result1 = await encryptData(data, password);
      const result2 = await encryptData(data, password);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it("should fail decryption with wrong password", async () => {
      const { encrypted, iv, salt } = await encryptData("data", "correctPass");

      await expect(
        decryptData({
          encryptedHex: encrypted,
          ivHex: iv,
          saltHex: salt,
          password: "wrongPass",
        }),
      ).rejects.toThrow();
    });

    it("should handle unicode data", async () => {
      const originalData = "中文测试数据 🚀";
      const password = "password123";

      const { encrypted, iv, salt } = await encryptData(originalData, password);

      const decrypted = await decryptData({
        encryptedHex: encrypted,
        ivHex: iv,
        saltHex: salt,
        password,
      });

      expect(decrypted).toBe(originalData);
    });

    it("should handle empty string", async () => {
      const originalData = "";
      const password = "password123";

      const { encrypted, iv, salt } = await encryptData(originalData, password);

      const decrypted = await decryptData({
        encryptedHex: encrypted,
        ivHex: iv,
        saltHex: salt,
        password,
      });

      expect(decrypted).toBe(originalData);
    });
  });

  describe("generateEncryptionKey / exportKey / importKey", () => {
    it("should generate a valid AES-GCM key", async () => {
      const key = await generateEncryptionKey();

      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe("AES-GCM");
    });

    it("should export key to hex string", async () => {
      const key = await generateEncryptionKey();
      const exported = await exportKey(key);

      expect(exported).toBeDefined();
      expect(exported.length).toBe(64); // 256-bit key = 64 hex chars
      expect(/^[0-9a-f]+$/i.test(exported)).toBe(true);
    });

    it("should import key from hex string", async () => {
      const originalKey = await generateEncryptionKey();
      const exported = await exportKey(originalKey);

      const importedKey = await importKey(exported);

      expect(importedKey).toBeDefined();
      expect(importedKey.algorithm.name).toBe("AES-GCM");
    });

    it("should round-trip key export/import correctly", async () => {
      const originalKey = await generateEncryptionKey();
      const exported = await exportKey(originalKey);
      const importedKey = await importKey(exported);
      const reExported = await exportKey(importedKey);

      expect(reExported).toBe(exported);
    });
  });

  describe("constantTimeCompare", () => {
    it("should return true for identical strings", () => {
      expect(constantTimeCompare("abc123", "abc123")).toBe(true);
      expect(constantTimeCompare("", "")).toBe(true);
    });

    it("should return false for different strings", () => {
      expect(constantTimeCompare("abc123", "abc124")).toBe(false);
      expect(constantTimeCompare("abc", "def")).toBe(false);
    });

    it("should return false for different lengths", () => {
      expect(constantTimeCompare("short", "longer string")).toBe(false);
      expect(constantTimeCompare("abc", "ab")).toBe(false);
    });

    it("should handle special characters", () => {
      expect(constantTimeCompare("pass@word!", "pass@word!")).toBe(true);
      expect(constantTimeCompare("pass@word!", "pass@word?")).toBe(false);
    });

    it("should handle unicode strings", () => {
      expect(constantTimeCompare("密码测试", "密码测试")).toBe(true);
      expect(constantTimeCompare("密码测试", "密码测验")).toBe(false);
    });
  });
});
