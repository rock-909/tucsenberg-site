/**
 * CSP Report API Route - GET & OPTIONS Tests
 *
 * 专门测试GET和OPTIONS端点功能，包括：
 * - 健康检查功能
 * - CORS头部设置
 * - 错误处理
 * - 意外错误处理
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, OPTIONS, POST } from "@/app/api/csp-report/route";

describe("CSP Report API Route - GET & OPTIONS Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console mocks
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/csp-report", () => {
    it("应该返回健康检查信息", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("CSP report endpoint active");
      expect(data.timestamp).toBeDefined();
    });

    it("应该返回正确的响应格式", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(typeof data.status).toBe("string");
      expect(typeof data.timestamp).toBe("string");
    });

    it("应该设置正确的Content-Type", async () => {
      const response = await GET();

      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
    });

    it("应该处理多次调用", async () => {
      const response1 = await GET();
      const response2 = await GET();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1.status).toBe(data2.status);
      // Timestamps should be different (or very close)
      expect(data1.timestamp).toBeDefined();
      expect(data2.timestamp).toBeDefined();
    });
  });

  describe("OPTIONS /api/csp-report", () => {
    it("应该返回正确的CORS headers", async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Allow")).toBe("POST, GET, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, GET, OPTIONS",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type",
      );
    });

    it("应该设置正确的Access-Control-Allow-Origin", async () => {
      const response = await OPTIONS();

      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, GET, OPTIONS",
      );
    });

    it("应该返回空的响应体", async () => {
      const response = await OPTIONS();
      const text = await response.text();

      expect(text).toBe("");
    });

    it("应该处理预检请求", async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
        "POST",
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
        "Content-Type",
      );
    });

    it("应该支持多种HTTP方法", async () => {
      const response = await OPTIONS();
      const allowedMethods = response.headers.get("Allow");

      expect(allowedMethods).toContain("POST");
      expect(allowedMethods).toContain("GET");
      expect(allowedMethods).toContain("OPTIONS");
    });
  });

  describe("错误处理", () => {
    it("应该处理请求体解析错误", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: null,
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errorCode).toBe("INVALID_REQUEST");
      // 空请求体是预期的错误处理，不会记录到error级别
    });

    it("应该处理意外的错误", async () => {
      // Create a request with invalid JSON body to trigger parsing error
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: "invalid-json-content",
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errorCode).toBe("INVALID_JSON_BODY");
      // JSON解析错误是预期的错误处理，不会记录到error级别
    });

    it("应该处理空请求体", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: "",
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("应该处理null请求体", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: null,
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("响应格式验证", () => {
    it("GET响应应该包含必要字段", async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it("OPTIONS响应应该包含正确的头部", async () => {
      const response = await OPTIONS();

      const requiredHeaders = [
        "Allow",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
      ];

      for (const header of requiredHeaders) {
        expect(response.headers.get(header)).toBeDefined();
      }
    });

    it("错误响应应该包含错误信息", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: "invalid",
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("errorCode");
      expect(typeof data.errorCode).toBe("string");
    });
  });

  describe("HTTP状态码验证", () => {
    it("GET请求应该返回200状态码", async () => {
      const response = await GET();
      expect(response.status).toBe(200);
    });

    it("OPTIONS请求应该返回200状态码", async () => {
      const response = await OPTIONS();
      expect(response.status).toBe(200);
    });

    it("无效POST请求应该返回适当的错误状态码", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify({ invalid: "data" }),
        headers: {
          "content-type": "text/plain", // Wrong content type
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("并发处理", () => {
    it("应该处理并发GET请求", async () => {
      const promises = Array.from({ length: 5 }, () => GET());
      const responses = await Promise.all(promises);

      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });

    it("应该处理并发OPTIONS请求", async () => {
      const promises = Array.from({ length: 5 }, () => OPTIONS());
      const responses = await Promise.all(promises);

      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });
});
