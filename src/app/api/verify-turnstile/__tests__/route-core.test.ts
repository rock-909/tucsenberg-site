import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { GET, OPTIONS, POST } from "@/app/api/verify-turnstile/route";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/lib/api/with-rate-limit", () => ({
  withRateLimit:
    (
      _preset: string,
      handler: (
        request: NextRequest,
        context: { clientIP: string },
      ) => Promise<Response>,
    ) =>
    (request: NextRequest) =>
      handler(request, { clientIP: "192.168.1.1" }),
}));

// Mock environment variables
vi.mock("@/lib/env", () => {
  const env = {
    TURNSTILE_SECRET_KEY: "test-secret-key",
    TURNSTILE_SITE_KEY: "test-site-key",
    TURNSTILE_ALLOWED_HOSTS: "localhost",
    TURNSTILE_EXPECTED_ACTION: "contact_form",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_TURNSTILE_ACTION: "contact_form",
  };

  return {
    env,
    runtimeEnv: env,
    getRuntimeEnvString: (key: string) => {
      if (key === "TURNSTILE_ALLOWED_ACTIONS") return "contact_form";
      if (key === "NODE_ENV") return process.env.NODE_ENV;
      return process.env[key];
    },
    getRuntimeEnvBoolean: (key: string) => process.env[key] === "true",
    isRuntimeDevelopment: () => process.env.NODE_ENV === "development",
  };
});

describe("Verify Turnstile API Route - Core Tests", () => {
  const validRequestBody = {
    token: "valid-turnstile-token",
    remoteip: "127.0.0.1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    vi.stubEnv("NODE_ENV", "development");
  });

  describe("POST /api/verify-turnstile - Basic Functionality", () => {
    it("应该成功验证有效的Turnstile token", async () => {
      // Mock successful Cloudflare response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          "error-codes": [],
          challenge_ts: "2023-01-01T00:00:00.000Z",
          hostname: "localhost",
          action: "contact_form",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.verified).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
      );
    });

    it("应该处理Turnstile验证失败", async () => {
      // Mock failed Cloudflare response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          "error-codes": ["invalid-input-response"],
          challenge_ts: null,
          hostname: "localhost",
        }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(
        API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
      );
    });

    it("应该处理缺少token的请求", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify({ remoteip: "127.0.0.1" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_MISSING_TOKEN);
    });

    it("应该处理空token的请求", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify({ token: "", remoteip: "127.0.0.1" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_MISSING_TOKEN);
    });
  });

  describe("GET /api/verify-turnstile - Health Check", () => {
    it("应该返回不泄露密钥配置状态的健康检查信息", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("Turnstile verification endpoint active");
      expect(data.data).not.toHaveProperty("configured");
      expect(data.data.timestamp).toBeDefined();
    });
  });

  describe("OPTIONS /api/verify-turnstile", () => {
    it("应该返回精确的同源预检方法合约", () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "OPTIONS",
          headers: {
            origin: "http://localhost:3000",
            host: "localhost:3000",
          },
        },
      );

      const response = OPTIONS(request);
      const allowMethods = response.headers.get("Access-Control-Allow-Methods");
      const methods = allowMethods
        ?.split(",")
        .map((method) => method.trim())
        .sort();

      expect(response.status).toBe(200);
      expect(methods).toEqual(["GET", "OPTIONS", "POST"]);
    });
  });

  describe("Error Handling", () => {
    it("应该处理无效的JSON请求体", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: "invalid-json",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      // 使用 safeParseJson 后，无效 JSON 应返回 400 + INVALID_JSON_BODY
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INVALID_JSON_BODY);
    });

    it("应该处理Cloudflare API网络错误", async () => {
      // Mock network error
      mockFetch.mockRejectedValue(new Error("Network error"));

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_NETWORK_ERROR);
    });
  });
});
