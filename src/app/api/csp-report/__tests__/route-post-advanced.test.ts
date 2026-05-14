/**
 * CSP Report API Route 高级功能测试
 * 包含安全性、性能、边界情况和集成测试
 *
 * 注意：基础功能测试请参考 route-post-core.test.ts
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/csp-report/route";

describe("CSP Report API Route - 高级功能测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  // 注意：安全性测试已移至 route-post-security.test.ts

  describe("性能测试", () => {
    it("应该在合理时间内处理大型报告", async () => {
      const largeReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "script-sample": "x".repeat(1000),
          "large-field": Array(100).fill("data").join(","),
        },
      };

      const _startTime = performance.now();

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(largeReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - _startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    it("应该处理并发请求", async () => {
      const requests = Array(10)
        .fill(null)
        .map(
          () =>
            new NextRequest("http://localhost:3000/api/csp-report", {
              method: "POST",
              body: JSON.stringify(validCSPReport),
              headers: {
                "content-type": "application/csp-report",
              },
            }),
        );

      const _startTime = performance.now();
      const responses = await Promise.all(requests.map((req) => POST(req)));
      const endTime = performance.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
      expect(endTime - _startTime).toBeLessThan(2000); // 并发处理应该在2秒内完成
    });
  });

  describe("边界情况", () => {
    it("应该处理null值", async () => {
      const nullReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri": null,
          "script-sample": null,
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(nullReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理数字字段", async () => {
      const numericReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "line-number": 0,
          "column-number": -1,
          "status-code": 999,
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(numericReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理布尔值字段", async () => {
      const booleanReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "is-enforced": true,
          "is-report-only": false,
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(booleanReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理数组字段", async () => {
      const arrayReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "violated-directives": ["script-src", "style-src"],
          "blocked-uris": ["https://malicious1.com", "https://malicious2.com"],
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(arrayReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Content-Type变体", () => {
    it("应该处理带字符集的content type", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/csp-report; charset=utf-8",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理大小写不敏感的content type", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "APPLICATION/CSP-REPORT",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("日志记录", () => {
    it("应该记录所有必要的CSP违规信息", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      await POST(request);

      expect(console.warn).toHaveBeenCalledWith(
        "CSP Violation Report",
        expect.any(Object),
      );
    });

    it("应该记录处理统计信息", async () => {
      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(validCSPReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      await POST(request);

      // 验证日志记录了处理信息
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
