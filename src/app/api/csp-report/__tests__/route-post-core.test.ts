/**
 * CSP Report API Route 核心功能测试
 * 包含基础CSP报告处理、验证和响应测试
 *
 * 注意：高级功能测试请参考 route-post.test.ts
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/csp-report/route";

// Unmock zod to use real validation in this test file
vi.unmock("zod");

describe("CSP Report API Route - 核心功能测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console mocks
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validCSPReport = {
    "csp-report": {
      "document-uri": "https://example.com/page",
      referrer: "https://example.com",
      "violated-directive": "script-src",
      "effective-directive": "script-src",
      "original-policy": "default-src 'self'; script-src 'self'",
      disposition: "enforce",
      "blocked-uri": "https://malicious.com/script.js",
      "line-number": 42,
      "column-number": 10,
      "source-file": "https://example.com/page",
      "status-code": 200,
      "script-sample": 'eval("malicious code")',
    },
  };

  describe("有效CSP报告处理", () => {
    it("应该成功处理有效的CSP报告", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        "CSP Violation Report",
        expect.any(Object),
      );
    });

    it("应该处理包含所有字段的完整CSP报告", async () => {
      const completeReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "violated-directive": "img-src",
          "effective-directive": "img-src",
          "blocked-uri": "https://untrusted.com/image.jpg",
          "script-sample": "",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(completeReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        "CSP Violation Report",
        expect.any(Object),
      );
    });

    it("应该处理不同类型的违规指令", async () => {
      const styleViolation = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "violated-directive": "style-src",
          "effective-directive": "style-src",
          "blocked-uri": "https://malicious.com/style.css",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(styleViolation),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(
        "CSP Violation Report",
        expect.any(Object),
      );
    });
  });

  describe("基础验证", () => {
    it("应该拒绝空请求体", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: "",
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.errorCode).toBe("INVALID_REQUEST");
    });

    it("应该拒绝无效的JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: "invalid json",
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.errorCode).toBe("INVALID_JSON_BODY");
    });

    it("应该拒绝缺少csp-report字段的请求", async () => {
      const invalidReport = {
        "not-csp-report": {
          "document-uri": "https://example.com/page",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(invalidReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.errorCode).toBe("INVALID_REQUEST");
    });

    it("应该用204接受空的csp-report对象（浏览器怪癖）", async () => {
      const emptyReport = {
        "csp-report": {},
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(emptyReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      // Empty csp-report is a browser quirk — acknowledged with 204 No Content
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe("Content-Type验证", () => {
    it("应该接受application/csp-report content type", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该接受application/json content type", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该拒绝不支持的content type", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "text/plain",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.errorCode).toBe("UNSUPPORTED_MEDIA_TYPE");
    });

    it("应该拒绝缺少content type的请求", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.errorCode).toBe("UNSUPPORTED_MEDIA_TYPE");
    });
  });

  // 注意：错误处理和响应格式测试已移至 route-post-advanced.test.ts
});
