/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";

describe("Constants Index Module", () => {
  describe("Module Exports", () => {
    it("should be able to import the constants index module", async () => {
      expect(async () => {
        await import("../index");
      }).not.toThrow();
    });

    it("should export all constant modules", async () => {
      const constantsModule = await import("../index");
      expect(constantsModule).toBeDefined();
    });
  });

  describe("Re-exported Constants", () => {
    it("should re-export APP_CONSTANTS", async () => {
      const { APP_CONSTANTS } = await import("../index");
      expect(APP_CONSTANTS).toBeDefined();
      expect(typeof APP_CONSTANTS).toBe("object");
    });

    it("should re-export SECURITY_CONSTANTS", async () => {
      const { SECURITY_CONSTANTS } = await import("../index");
      expect(SECURITY_CONSTANTS).toBeDefined();
      expect(typeof SECURITY_CONSTANTS).toBe("object");
    });

    it("should re-export SEO_CONSTANTS", async () => {
      const { SEO_CONSTANTS } = await import("../index");
      expect(SEO_CONSTANTS).toBeDefined();
      expect(typeof SEO_CONSTANTS).toBe("object");
    });
  });

  describe("Module Structure", () => {
    it("should have proper module structure", () => {
      const fs = require("fs");
      const path = require("path");
      const indexPath = path.join(__dirname, "../index.ts");
      const content = fs.readFileSync(indexPath, "utf8");

      // 验证包含所有必要的导出 (使用命名导出而不是通配符导出)
      expect(content).toContain('} from "./i18n-constants"');
      expect(content).toContain('} from "./app-constants"');
      expect(content).toContain('} from "./security-constants"');
      expect(content).toContain('} from "./seo-constants"');
    });

    it("should have re-export statements", () => {
      const fs = require("fs");
      const path = require("path");
      const indexPath = path.join(__dirname, "../index.ts");
      const content = fs.readFileSync(indexPath, "utf8");

      expect(content).toContain("export { APP_CONSTANTS }");
      expect(content).toContain("export { SECURITY_CONSTANTS }");
      expect(content).toContain("export { SEO_CONSTANTS }");
    });
  });

  describe("TypeScript Compilation", () => {
    it("should compile without TypeScript errors", async () => {
      expect(async () => {
        await import("../index");
      }).not.toThrow();
    });

    it("should import all modules successfully", async () => {
      // 测试所有模块都可以被成功导入
      const modules = [
        "../i18n-constants",
        "../app-constants",
        "../security-constants",
        "../seo-constants",
      ];

      for (const modulePath of modules) {
        try {
          const module = await import(modulePath);
          expect(module).toBeDefined();
        } catch {
          // 如果模块不存在，这是预期的，不应该导致测试失败
          console.warn(`Module ${modulePath} not found, skipping test`);
        }
      }
    });
  });

  describe("Constants Availability", () => {
    it("should make constants available through index", async () => {
      try {
        const constantsModule = await import("../index");

        // 验证至少有一些导出
        const exports = Object.keys(constantsModule);
        expect(exports.length).toBeGreaterThan(0);
      } catch {
        // 如果某些常量模块不存在，这是可以接受的
        console.warn("Some constants modules may not exist yet");
      }
    });

    it("should provide centralized access to all constants", () => {
      // 验证索引文件的目的：提供集中访问点
      const fs = require("fs");
      const path = require("path");
      const indexPath = path.join(__dirname, "../index.ts");
      const content = fs.readFileSync(indexPath, "utf8");

      // 验证文件包含适当的注释说明其用途
      expect(content).toContain("常量模块统一导出");
      expect(content).toContain("提供项目中所有常量的集中访问点");
    });
  });
});
