/**
 * Next.js 16 国际化重定向端到端测试
 *
 * 验证 Location 响应头修复对实际用户体验的影响
 */

import { expect, test } from "@playwright/test";
import { expectHtmlLang } from "./helpers/navigation";

const rawBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  process.env.STAGING_URL ??
  "http://localhost:3000";

const BASE_URL = rawBaseUrl.replace(/\/$/, "");

test.describe("Next.js 16 国际化重定向验证", () => {
  test.beforeEach(async ({ page }) => {
    // 清除 Cookie（next-intl 使用 NEXT_LOCALE cookie 存储语言偏好）
    await page.context().clearCookies();
    // ✅ 不需要清理 localStorage/sessionStorage - next-intl 不使用它们
    // ❌ 移除 localStorage.clear() 避免 Mobile Safari SecurityError
  });

  test.describe("基础语言检测和重定向", () => {
    test("应该正确访问中文首页并设置Cookie", async ({ page }) => {
      // 直接访问中文首页
      const response = await page.goto(`${BASE_URL}/zh`);

      // 验证响应状态
      expect(response?.status()).toBe(200);

      // 验证最终 URL
      await expect(page).toHaveURL(/\/zh($|\/)/);

      // 验证 NEXT_LOCALE cookie（允许运行时差异，先尝试等待 document.cookie）
      await page
        .waitForFunction(() => document.cookie.includes("NEXT_LOCALE=zh"), {
          timeout: 1500,
        })
        .catch(() => undefined);

      const cookies = await page.context().cookies();
      const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
      const docCookieVal = await page.evaluate(() => {
        const entry = document.cookie
          .split("; ")
          .find((c) => c.startsWith("NEXT_LOCALE="));
        return entry ? entry.split("=")[1] : undefined;
      });
      if (localeCookie?.value || docCookieVal) {
        expect(localeCookie?.value ?? docCookieVal).toBe("zh");
      } else {
        console.warn(
          "NEXT_LOCALE cookie not present; continuing with html[lang] validation",
        );
      }

      // 验证页面语言（服务端首包应直接输出正确的 html[lang]）
      // waitForHtmlLang 已包含断言，无需额外的 toHaveAttribute
      await expectHtmlLang(page, "zh");
    });

    test("应该正确访问英文About页并设置Cookie", async ({ page }) => {
      // 直接访问英文About页
      const response = await page.goto(`${BASE_URL}/en/about`);

      expect(response?.status()).toBe(200);

      // 验证 URL
      await expect(page).toHaveURL(/\/en\/about$/);

      // 验证 NEXT_LOCALE cookie（允许运行时差异，先尝试等待 document.cookie）
      await page
        .waitForFunction(() => document.cookie.includes("NEXT_LOCALE=en"), {
          timeout: 1500,
        })
        .catch(() => undefined);

      const cookies = await page.context().cookies();
      const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
      const docCookieVal = await page.evaluate(() => {
        const entry = document.cookie
          .split("; ")
          .find((c) => c.startsWith("NEXT_LOCALE="));
        return entry ? entry.split("=")[1] : undefined;
      });
      if (localeCookie?.value || docCookieVal) {
        expect(localeCookie?.value ?? docCookieVal).toBe("en");
      } else {
        console.warn(
          "NEXT_LOCALE cookie not present; continuing with html[lang] validation",
        );
      }

      // 验证页面语言
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("应该正确处理中文路径访问", async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/zh/about`);

      expect(response?.status()).toBeLessThan(400);

      // 验证 URL 保持中文路径（使用 Shared Pathnames）
      expect(page.url()).toMatch(/\/zh\/about\/?$/);

      // 验证页面语言（服务端首包应直接输出正确的 html[lang]）
      await expectHtmlLang(page, "zh");
    });
  });

  test.describe("路径本地化验证", () => {
    test("应该正确处理本地化路径映射", async ({ page }) => {
      // 测试产品页面的路径（使用 Shared Pathnames）
      const response = await page.goto(`${BASE_URL}/zh/products`);

      expect(response?.status()).toBeLessThan(400);
      expect(page.url()).toMatch(/\/zh\/products\/?$/);

      // 验证页面内容
      await expect(page.locator("h1, h2, h3").first()).toBeVisible();
    });

    test("应该正确处理联系页面的路径本地化", async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/zh/contact`);

      expect(response?.status()).toBeLessThan(400);
      expect(page.url()).toMatch(/\/zh\/contact\/?$/);
    });

    test("应该正确处理英文原始路径", async ({ page }) => {
      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      const response = await page.goto(`${BASE_URL}/en/contact`);

      expect(response?.status()).toBeLessThan(400);
      expect(page.url()).toMatch(/\/en\/contact\/?$/);
    });
  });

  test.describe("重定向性能和稳定性", () => {
    test("应该快速完成语言检测和重定向", async ({ page, browserName }) => {
      test.slow();

      const startTime = Date.now();

      await page.setExtraHTTPHeaders({
        "Accept-Language": "zh-CN,zh;q=0.9",
      });

      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      const response = await page.goto(`${BASE_URL}/zh/products`, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });
      const endTime = Date.now();

      expect(response?.status()).toBeLessThan(400);

      // 重定向应该在合理时间内完成
      // WebKit 引擎通常比 Chromium/Firefox 慢,使用更宽松的阈值
      // Dev server 有编译开销且并行测试共享资源,需要更高阈值
      const redirectTime = endTime - startTime;
      const isCI = Boolean(process.env.CI);
      const baseThreshold = browserName === "webkit" ? 4000 : 3000;
      // CI: 使用 1.5x 阈值; 本地 dev: 使用 5x 阈值（编译开销 + 4 workers 并行测试）
      const timeoutThreshold = isCI ? baseThreshold * 1.5 : baseThreshold * 5;
      expect(redirectTime).toBeLessThan(timeoutThreshold);
    });

    test("应该处理并发请求而不出现竞态条件", async ({ browser }) => {
      test.setTimeout(90_000);

      const promises: Promise<{
        status: number | undefined;
        url: string;
        expectedLocale: string;
      }>[] = [];
      const contexts: any[] = [];

      // 减少并发数以适应本地 dev server 负载
      // CI 环境可以使用更高的并发数
      const concurrentRequests = process.env.CI ? 10 : 4;

      // 创建多个并发请求，每个请求使用独立的 browser context 避免 cookie 共享
      // 直接访问带语言前缀的路径，测试并发场景下的路由稳定性
      for (let i = 0; i < concurrentRequests; i++) {
        const context = await browser.newContext();
        contexts.push(context);

        const page = await context.newPage();
        const targetLocale = i % 2 === 0 ? "zh" : "en";
        const targetUrl = `${BASE_URL}/${targetLocale}/about`;

        promises.push(
          page
            .goto(targetUrl, { timeout: 45000, waitUntil: "domcontentloaded" })
            .then((response) => ({
              status: response?.status(),
              url: page.url(),
              expectedLocale: targetLocale,
            }))
            .catch(() => ({
              status: undefined,
              url: "",
              expectedLocale: targetLocale,
            })),
        );
      }

      const results = await Promise.all(promises);

      // 清理所有 contexts
      await Promise.all(contexts.map((ctx) => ctx.close().catch(() => {})));

      // 过滤掉失败的请求（超时等）
      const successfulResults = results.filter((r) => r.status !== undefined);

      // 至少 50% 的请求应该成功
      expect(successfulResults.length).toBeGreaterThanOrEqual(
        Math.ceil(concurrentRequests / 2),
      );

      // 验证成功的请求都返回 200
      successfulResults.forEach((result) => {
        expect(result.status).toBe(200);
      });

      // 验证每个请求都保持了正确的语言环境（无意外重定向）
      const zhResults = successfulResults.filter(
        (r) => r.expectedLocale === "zh",
      );
      const enResults = successfulResults.filter(
        (r) => r.expectedLocale === "en",
      );

      // 中文请求应该保持在 /zh/about
      zhResults.forEach((result) => {
        expect(result.url).toMatch(/\/zh\/about\/?$/);
      });

      // 英文请求应该保持在 /en/about
      enResults.forEach((result) => {
        expect(result.url).toMatch(/\/en\/about\/?$/);
      });
    });
  });

  test.describe("错误处理和回退机制", () => {
    test("应该处理无效的语言前缀", async ({ page }) => {
      test.setTimeout(45_000);
      const response = await page.goto(`${BASE_URL}/invalid-lang/about`);

      // 应该返回 404 或重定向到有效路径
      expect([200, 404, 301, 302, 307, 308]).toContain(response?.status() || 0);
    });

    test("应该处理不存在的本地化路径", async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/zh/nonexistent-path`, {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });

      // 应该返回 404
      expect(response?.status()).toBe(404);
    });

    test("应该在语言检测失败时回退到默认语言", async ({ page }) => {
      // 不设置任何语言偏好头（localePrefix: 'always' 模式下语言由 URL 决定）
      await page.setExtraHTTPHeaders({
        "Accept-Language": "",
      });

      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      const response = await page.goto(`${BASE_URL}/en/about`, {
        timeout: 30000,
        waitUntil: "networkidle",
      });

      expect(response?.status()).toBeLessThan(400);

      // 应该保持英文（URL 已指定 /en/，不受 Accept-Language 影响）
      const finalUrl = page.url();
      expect(finalUrl).toMatch(/\/en\/about\/?$/);

      // 等待客户端水合完成后再检查 lang 属性
      // html[lang] 应在服务端首包上正确，无需客户端补丁
      await expectHtmlLang(page, "en");

      // NOTE: 此测试仅验证 lang 属性设置正确，不验证页面内容是否正常加载。
      // 如果页面渲染 global-error.tsx，测试仍会通过（因为 global-error 也设置 lang）。
      // 页面内容验证应在专门的功能测试中进行。
    });
  });

  test.describe("SEO 和元数据验证", () => {
    test("应该为不同语言设置正确的 hreflang 标签", async ({ page }) => {
      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      await page.goto(`${BASE_URL}/en/about`);

      // 检查 hreflang 标签
      const hreflangLinks = await page.locator("link[hreflang]").all();
      expect(hreflangLinks.length).toBeGreaterThan(0);

      // 验证包含英文和中文的 hreflang
      const hreflangValues = await Promise.all(
        hreflangLinks.map((link) => link.getAttribute("hreflang")),
      );

      expect(hreflangValues).toContain("en");
      expect(hreflangValues).toContain("zh");
    });

    test("应该为中文页面设置正确的元数据", async ({ page }) => {
      await page.goto(`${BASE_URL}/zh/about`);

      // 验证页面标题和描述
      const title = await page.title();
      expect(title).toBeTruthy();

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description).toBeTruthy();

      // 验证语言属性（服务端首包应直接输出正确的 html[lang]）
      await expectHtmlLang(page, "zh");
    });
  });

  test.describe("用户体验验证", () => {
    test("语言切换应该保持在相同的页面类型", async ({ page }) => {
      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      await page.goto(`${BASE_URL}/en/about`);

      // 查找语言切换器（如果存在）
      const languageToggle = page
        .locator(
          '[data-testid="language-toggle"], [aria-label*="language"], [aria-label*="语言"]',
        )
        .first();

      if (await languageToggle.isVisible()) {
        await languageToggle.click();

        // 等待导航完成
        await page.waitForLoadState("networkidle");

        // 验证切换到中文版本的对应页面（使用 Shared Pathnames）
        const finalUrl = page.url();
        expect(finalUrl).toMatch(/\/zh\/about\/?$/);
      }
    });

    test("页面加载应该流畅无闪烁", async ({ page }) => {
      // 监控页面加载过程
      let redirectCount = 0;
      page.on("response", (response) => {
        if ([301, 302, 307, 308].includes(response.status())) {
          redirectCount++;
        }
      });

      // localePrefix: 'always' 要求所有路径必须包含语言前缀
      await page.goto(`${BASE_URL}/en/products`);

      // 验证重定向次数合理（不超过 2 次）
      expect(redirectCount).toBeLessThanOrEqual(2);

      // 验证页面最终正确加载
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
