import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import { PATHNAMES } from "@/config/paths/utils";

/**
 * 这个文件 2026-07-29 从 22 条收到 7 条。删掉的几乎全是同一件事被断言了两到四遍：
 *
 * - `alternateLinks` 未设置：两条
 * - `localeDetection: false`：两条
 * - `locales` 等于 `LOCALES_CONFIG.locales`：三条
 * - `defaultLocale`：三条
 * - `pathnames` 的 key 等于 value：三条
 * - `pathnames` 里有某几条具体路径：四条（主页面、动态路由、法律页各写了一遍，
 *   而路径表本身是从 `PATHNAMES` 派生的）
 *
 * 另有三条是 TypeScript 已经保证的：`Array.isArray(config.locales)`、
 * `typeof config.defaultLocale === "string"`、以及把 `LOCALES_CONFIG.locales`
 * 逐项断言它自己 `toContain`。还有一条 `requiredFields.forEach(toHaveProperty)`
 * ——上面每个字段都已经被断了具体值，再断一次「它存在」是恒真。
 *
 * 留下的是路由配置真正会出错的地方：locale 真相是不是从单一来源取的、路径表是不是
 * 从 `PATHNAMES` 全量派生（漏一条路由会让 next-intl 不认识那个 URL）、
 * shared pathnames 形状、以及两个「必须关着」的开关。
 */

const mockCreateNavigation = vi.fn();
const mockDefineRouting = vi.fn();

vi.mock("next-intl/navigation", () => ({
  createNavigation: mockCreateNavigation,
}));

vi.mock("next-intl/routing", () => ({
  defineRouting: mockDefineRouting,
}));

describe("i18n Routing Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockDefineRouting.mockImplementation((config) => config);

    mockCreateNavigation.mockReturnValue({
      Link: vi.fn(),
      redirect: vi.fn(),
      usePathname: vi.fn(),
      useRouter: vi.fn(),
    });
  });

  async function getRoutingDefinition() {
    await import("../routing-config");
    const config = mockDefineRouting.mock.calls[0]?.[0];
    if (!config) {
      throw new Error("defineRouting was not called");
    }
    return config;
  }

  it("takes locale truth from LOCALES_CONFIG rather than its own literals", async () => {
    const config = await getRoutingDefinition();

    expect(config.locales).toEqual(LOCALES_CONFIG.locales);
    expect(config.defaultLocale).toBe(LOCALES_CONFIG.defaultLocale);
    expect(config.localePrefix).toBe(LOCALES_CONFIG.localePrefix);
  });

  // 从 `PATHNAMES` 全量派生，而不是钉死一份路径清单：加一个页面忘了登记路由，
  // 这条会红；退役一个页面不该让这里变红。
  it("hands next-intl every registered pathname", async () => {
    const config = await getRoutingDefinition();

    expect(config.pathnames).toEqual(PATHNAMES);
  });

  // Shared pathnames：key 和 value 相同意味着所有语言共用同一个 URL。写成对象形式
  // 就是给每种语言配不同 URL，那和 `localePrefix: "never"` 的单语言站点自相矛盾。
  it("keeps pathnames in shared form", async () => {
    const config = await getRoutingDefinition();

    Object.entries(config.pathnames).forEach(([key, value]) => {
      expect(value).toBe(key);
      expect(key).toMatch(/^\//);
    });
  });

  // 这两个开关必须关着。localeDetection 打开会让浏览器语言把英文买家重定向到一个
  // 不存在的语言路由；alternateLinks 在 `localePrefix: "never"` 下不生成任何东西，
  // hreflang/canonical 归 metadata 层。
  it("keeps locale detection and alternate links off", async () => {
    const config = await getRoutingDefinition();

    expect(config.localeDetection).toBe(false);
    expect(config.alternateLinks).toBeUndefined();
  });

  it("keeps every locale code a two-letter lowercase tag", async () => {
    const config = await getRoutingDefinition();

    config.locales.forEach((locale: string) => {
      expect(locale).toMatch(/^[a-z]{2}$/);
    });
  });

  it("re-exports the same routing object app code imports", async () => {
    const routingModule = await import("../routing");

    expect(routingModule.routing.locales).toEqual(LOCALES_CONFIG.locales);
    expect(routingModule.routing.defaultLocale).toBe(
      LOCALES_CONFIG.defaultLocale,
    );
  });

  it("exposes the locale-aware navigation helpers", async () => {
    const routingModule = await import("../routing");

    expect(routingModule.Link).toBeDefined();
    expect(routingModule.redirect).toBeDefined();
    expect(routingModule.usePathname).toBeDefined();
    expect(routingModule.useRouter).toBeDefined();
  });
});
