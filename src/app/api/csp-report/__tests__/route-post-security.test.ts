/**
 * CSP Report API Route 安全性测试
 * 包含安全性、边界情况和恶意输入测试
 *
 * 注意：基础功能测试请参考 route-post-core.test.ts
 * 注意：高级功能测试请参考 route-post-advanced.test.ts
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/csp-report/route";

describe("CSP Report API Route - 安全性测试", () => {
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

  describe("恶意输入处理", () => {
    it("应该处理恶意的超长字符串", async () => {
      const maliciousReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri": `https://malicious.com/${"a".repeat(10000)}`,
          "script-sample": "x".repeat(50000),
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(maliciousReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(413);
    });

    it("应该处理包含特殊字符的报告", async () => {
      const specialCharsReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri":
            'https://example.com/script.js?param=<script>alert("xss")</script>',
          "script-sample": '"><script>alert("xss")</script>',
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(specialCharsReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理Unicode字符", async () => {
      const unicodeReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "document-uri": "https://测试.com/页面",
          "blocked-uri": "https://恶意.com/脚本.js",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(unicodeReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该处理深度嵌套的对象", async () => {
      const deepNestedReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "extra-field": {
            level1: {
              level2: {
                level3: {
                  level4: "deep value",
                },
              },
            },
          },
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(deepNestedReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("注入攻击防护", () => {
    it("应该防护SQL注入尝试", async () => {
      const sqlInjectionReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri": "https://example.com/script.js'; DROP TABLE users; --",
          "script-sample": "1' OR '1'='1",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(sqlInjectionReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该防护NoSQL注入尝试", async () => {
      const nosqlInjectionReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri": "https://example.com/script.js",
          "script-sample": '{"$ne": null}',
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(nosqlInjectionReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("应该防护命令注入尝试", async () => {
      const commandInjectionReport = {
        "csp-report": {
          ...validCSPReport["csp-report"],
          "blocked-uri": "https://example.com/script.js; rm -rf /",
          "script-sample": "`rm -rf /`",
        },
      };

      const request = new NextRequest("http://localhost:3000/api/csp-report", {
        method: "POST",
        body: JSON.stringify(commandInjectionReport),
        headers: {
          "content-type": "application/csp-report",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  // 注意：DoS攻击防护、数据验证和协议安全测试已移至其他专门的测试文件
});
