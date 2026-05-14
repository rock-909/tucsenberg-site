/**
 * CSP Report API Route - POST Tests
 *
 * 专门测试POST端点功能，包括：
 * - 有效CSP报告处理
 * - 内容类型验证
 * - JSON解析错误处理
 * - 可疑模式检测
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/csp-report/route";

// 注意：基础测试已移至 route-post-core.test.ts
// 注意：高级功能测试已移至 route-post-advanced.test.ts

describe("CSP Report API Route - 集成测试", () => {
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

  describe("集成测试", () => {
    it("应该处理完整的CSP报告流程", async () => {
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

    it("应该处理多种违规类型的集成场景", async () => {
      const reports = [
        {
          "csp-report": {
            ...validCSPReport["csp-report"],
            "violated-directive": "script-src",
          },
        },
        {
          "csp-report": {
            ...validCSPReport["csp-report"],
            "violated-directive": "style-src",
          },
        },
        {
          "csp-report": {
            ...validCSPReport["csp-report"],
            "violated-directive": "img-src",
          },
        },
      ];

      for (const report of reports) {
        const request = new NextRequest(
          "http://localhost:3000/api/csp-report",
          {
            method: "POST",
            body: JSON.stringify(report),
            headers: {
              "content-type": "application/csp-report",
            },
          },
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
      }

      const warnMock = console.warn as unknown as {
        mock: { calls: unknown[][] };
      };
      const cspWarnCalls = warnMock.mock.calls.filter(
        (call) => call[0] === "CSP Violation Report",
      );
      expect(cspWarnCalls).toHaveLength(3);
    });
  });
});
