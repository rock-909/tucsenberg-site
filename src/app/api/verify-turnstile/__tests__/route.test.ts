import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { GET, OPTIONS, POST } from "@/app/api/verify-turnstile/route";

const mockRateLimitMode = vi.hoisted(() => ({
  value: "allow" as "allow" | "limited" | "failure",
}));

// Mock global fetch
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
    async (request: NextRequest) => {
      if (mockRateLimitMode.value === "limited") {
        return Response.json(
          { success: false, errorCode: "RATE_LIMIT_EXCEEDED" },
          { status: 429 },
        );
      }

      if (mockRateLimitMode.value === "failure") {
        return Response.json(
          { success: false, errorCode: "SERVICE_UNAVAILABLE" },
          { status: 503 },
        );
      }

      return handler(request, { clientIP: "192.168.1.1" });
    },
}));

// Mock environment variables
vi.mock("@/lib/env", () => ({
  env: {
    TURNSTILE_SECRET_KEY: "test-secret-key",
    TURNSTILE_SITE_KEY: "test-site-key",
    TURNSTILE_ALLOWED_HOSTS: "localhost",
    TURNSTILE_EXPECTED_ACTION: "contact_form",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    NEXT_PUBLIC_TURNSTILE_ACTION: "contact_form",
  },
  getRuntimeEnvString: (key: string) => {
    const runtimeValue = process.env[key];
    if (runtimeValue !== undefined) {
      return runtimeValue;
    }

    if (key === "TURNSTILE_ALLOWED_ACTIONS") {
      return "contact_form";
    }

    if (key === "TURNSTILE_EXPECTED_ACTION") {
      return "contact_form";
    }

    return undefined;
  },
  getRuntimeEnvBoolean: () => false,
  isRuntimeDevelopment: () => process.env.NODE_ENV === "development",
}));

describe("Verify Turnstile API Route", () => {
  const validRequestBody = {
    token: "valid-turnstile-token",
    remoteip: "127.0.0.1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockRateLimitMode.value = "allow";
    vi.stubEnv("NODE_ENV", "development");
  });

  describe("POST /api/verify-turnstile", () => {
    it("应该成功验证有效的Turnstile token", async () => {
      // Mock successful Cloudflare response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            challenge_ts: "2024-01-01T00:00:00.000Z",
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
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
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
        json: () =>
          Promise.resolve({
            success: false,
            "error-codes": ["invalid-input-response"],
          }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
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
          body: JSON.stringify({}),
          headers: {
            "content-type": "application/json",
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
          body: JSON.stringify({ token: "" }),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_MISSING_TOKEN);
    });

    it("应该处理无效的JSON请求体", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: "invalid-json",
          headers: {
            "content-type": "application/json",
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

    it("应该在请求体超过共享 JSON 限制时返回 413", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
            "content-length": "70000",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.PAYLOAD_TOO_LARGE);
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
            "content-type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_NETWORK_ERROR);
    });

    it("应该在限流基础设施失败时返回 503", async () => {
      mockRateLimitMode.value = "failure";

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.SERVICE_UNAVAILABLE);
    });

    it("应该处理Cloudflare API响应错误", async () => {
      // Mock HTTP error response — Cloudflare returning non-2xx is an upstream failure (503)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_NETWORK_ERROR);
    });

    it("应该正确提取客户端IP地址", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            hostname: "localhost",
            action: "contact_form",
          }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify({ token: "test-token" }),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "192.168.1.1, 10.0.0.1",
            "x-real-ip": "192.168.1.1",
          },
        },
      );

      await POST(request);

      // 验证 fetch 调用中包含了正确的 IP 地址（只取 x-forwarded-for 的第一个 IP）
      const fetchCall = mockFetch.mock.calls[0];
      const formData = fetchCall?.[1]?.body;
      const formDataString = formData?.toString();
      expect(formDataString).toContain("remoteip=192.168.1.1");
    });

    it("应该忽略客户端提供的remoteip参数（安全措施）", async () => {
      // SECURITY: Client-provided remoteip is intentionally ignored to prevent IP spoofing
      // The server MUST use server-derived IP from request headers
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            hostname: "localhost",
            action: "contact_form",
          }),
      });

      const requestWithRemoteIp = {
        token: "test-token",
        remoteip: "203.0.113.1", // This should be ignored
      };

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(requestWithRemoteIp),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "192.168.1.1",
          },
        },
      );

      await POST(request);

      // 验证使用了服务端派生的IP而不是客户端提供的IP（安全措施）
      const fetchCall = mockFetch.mock.calls[0];
      const formData = fetchCall?.[1]?.body;
      const formDataString = formData?.toString();
      expect(formDataString).toContain("remoteip=192.168.1.1"); // 使用服务端派生的IP
      expect(formDataString).not.toContain("203.0.113.1"); // 客户端提供的IP被忽略
    });
  });

  describe("GET /api/verify-turnstile", () => {
    it("应该返回不泄露密钥配置状态的健康检查信息", async () => {
      // GET request doesn't need request object

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

  describe("配置验证", () => {
    it("应该处理未配置Turnstile的情况", async () => {
      // 直接mock env模块的TURNSTILE_SECRET_KEY为空字符串
      const envModule = await import("@/lib/env");
      const originalSecretKey = envModule.env.TURNSTILE_SECRET_KEY;

      // 临时修改env对象
      Object.defineProperty(envModule.env, "TURNSTILE_SECRET_KEY", {
        value: "",
        writable: true,
        configurable: true,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_NOT_CONFIGURED);

      // 恢复原始值
      Object.defineProperty(envModule.env, "TURNSTILE_SECRET_KEY", {
        value: originalSecretKey,
        writable: true,
        configurable: true,
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      mockRateLimitMode.value = "limited";

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
        },
      );

      const response = await POST(request);

      expect(response.status).toBe(429);
    });

    it("should process normally when rate limit allows", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
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
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 503 when Turnstile API throws exception", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Service unavailable"));

      const request = new NextRequest(
        "http://localhost:3000/api/verify-turnstile",
        {
          method: "POST",
          body: JSON.stringify(validRequestBody),
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
        },
      );

      const response = await POST(request);

      // Current implementation returns 500, test expects 503
      // This verifies whether error handling distinguishes upstream failures
      expect(response.status).toBe(503);
    });
  });
});
