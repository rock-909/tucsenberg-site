import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * Contact Form Smoke Tests - Test Mode
 * Proof lane: local/test-mode
 *
 * 这是本地/CI 的 test-mode smoke：
 * - 允许使用 Playwright 注入的测试环境与 Turnstile 测试路径
 * - 用来验证联系页结构、基础交互、国际化和 smoke 级行为
 * - 不是生产态最终证明；真实提交链路由 post-deploy smoke 负责
 */

// Contact 页面较重，在完整 E2E + 4 workers 下容易在高峰期超时，
// 这里将本文件内用例串行执行，降低瞬时负载。
test.describe.configure({ mode: "serial" });

test.describe("Contact Form - Test-Mode Smoke", () => {
  const expectedContactTitle = /Contact Tucsenberg/i;

  const resolveSiteUrl = (info: TestInfo, path: string): string => {
    const base =
      process.env.STAGING_URL ||
      info.project?.use?.baseURL ||
      process.env.PLAYWRIGHT_BASE_URL ||
      "http://localhost:3000";

    try {
      return new URL(path, base).toString();
    } catch {
      return `${base.replace(/\/$/, "")}${path}`;
    }
  };

  const resolveContactUrl = (info: TestInfo): string =>
    resolveSiteUrl(info, "/contact");

  const gotoContactPage = async (page: Page, info: TestInfo): Promise<void> => {
    const targetUrl = resolveContactUrl(info);
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
    });

    // 等待页面主要内容加载
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});

    // Progressive enhancement: scroll the form column into view so InquiryForm
    // and LazyTurnstile can mount before interaction.
    await page
      .getByTestId("contact-form-column")
      .scrollIntoViewIfNeeded({ timeout: 10_000 });

    const fullNameInput = page.locator('input[name="fullName"]').first();
    await expect(fullNameInput).toBeEditable({ timeout: 15_000 });

    await expect(page).toHaveTitle(expectedContactTitle);
    await expectInteractiveContactForm(page);
  };

  const expectInteractiveContactForm = async (page: Page): Promise<void> => {
    await page
      .getByTestId("contact-form-column")
      .scrollIntoViewIfNeeded({ timeout: 5000 });

    const fullNameInput = page.locator('input[name="fullName"]').first();
    const messageInput = page.locator('textarea[name="message"]').first();
    const privacyNotice = page.getByTestId("form-privacy-notice").first();

    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toBeEditable();
    await expect(messageInput).toBeEditable();
    await expect(privacyNotice).toBeVisible();
  };

  test.beforeEach(async ({ page }) => {
    // 设置 Turnstile 测试密钥
    await page.addInitScript(() => {
      // @ts-expect-error - 注入测试环境变量
      window.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
    });
  });

  test.describe("1. Turnstile 验证流程", () => {
    test("联系表单内存在 Turnstile 挂载区域", async ({ page }) => {
      await gotoContactPage(page, test.info());

      // 检查表单存在
      const form = page.locator("form").first();
      await expect(form).toBeVisible();

      // LazyTurnstile 始终在表单内渲染一个挂载区域，只是形态会变化：
      // 懒加载占位骨架（.animate-pulse）→ 真实 widget（Cloudflare iframe）
      // 或加载失败回退（.turnstile-fallback）。这里断言该区域确实存在，
      // 而不是像旧写法那样谎称 widget 一定加载成功后再用 console.warn 掩盖失败。
      // test-mode 懒加载时机下 widget 未必及时出现，但挂载区域一定在。
      const turnstileRegion = form.locator(
        'iframe[src*="challenges.cloudflare.com"], .turnstile-fallback, .animate-pulse',
      );
      await expect(turnstileRegion.first()).toBeVisible();
    });

    test("提交按钮初始状态应该被禁用", async ({ page }) => {
      await gotoContactPage(page, test.info());

      const submitButton = page.getByRole("button", {
        name: /send inquiry|submit/i,
      });
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("2. 表单验证与错误信息", () => {
    test("应该显示必填字段错误（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info());

      // 检查所有必填字段的 required 属性
      // 注意：必填标记 (*) 使用 CSS ::after 伪元素，Playwright 无法直接检测
      // 改为检查 input[required] 属性
      const requiredInputs = page.locator(
        'input[required], textarea[required], input[type="checkbox"][required]',
      );
      const count = await requiredInputs.count();
      expect(count).toBeGreaterThan(0);

      // Verify core required fields (fullName, email). Message is optional.
      await expect(page.locator('input[name="fullName"]')).toHaveAttribute(
        "required",
      );
      await expect(page.locator('input[name="email"]')).toHaveAttribute(
        "required",
      );
      await expect(
        page.locator('textarea[name="message"]'),
      ).not.toHaveAttribute("required");
      await expect(page.locator('input[name="company"]')).toHaveCount(0);
    });

    test("应该验证邮箱格式", async ({ page }) => {
      await gotoContactPage(page, test.info());

      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  test.describe("3. 表单字段渲染", () => {
    test("应该渲染所有必需字段（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info());

      // 检查所有必需字段
      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
      await expect(page.locator('input[name="company"]')).toHaveCount(0);

      // 检查提交按钮旁的隐私声明（替代旧的隐私复选框）
      await expect(page.getByTestId("form-privacy-notice")).toBeVisible();
      await expect(page.locator('input[name="acceptPrivacy"]')).toHaveCount(0);
    });
  });

  test.describe("4. 英文单语言验证", () => {
    test("英文页面应该显示英文标签", async ({ page }) => {
      await gotoContactPage(page, test.info());

      // InquiryForm labels come from inquiry.form, not legacy contact.form.
      await expect(page.getByLabel(/^full name/i)).toBeVisible();
      await expect(page.getByLabel(/^email address/i)).toBeVisible();
      await expect(page.locator('input[name="company"]')).toHaveCount(0);
    });

    test("联系页不暴露中文语言入口", async ({ page }) => {
      await gotoContactPage(page, test.info());

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByText("简体中文")).toHaveCount(0);
      await expect(page.getByText("中文")).toHaveCount(0);
      await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
      await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
    });

    test("/zh/contact 是已移除语言路由", async ({ page }) => {
      const response = await page.goto(
        resolveSiteUrl(test.info(), "/zh/contact"),
        {
          waitUntil: "domcontentloaded",
        },
      );

      expect(response?.status(), "/zh/contact should return HTTP 404").toBe(
        404,
      );
      await expect(page.locator("html")).not.toHaveAttribute("lang", "zh");
      await expect(page.getByText("简体中文")).toHaveCount(0);
      await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
    });
  });

  test.describe("5. 性能与可访问性", () => {
    test("页面加载时间应该合理", async ({ page }) => {
      const startTime = Date.now();

      // 性能测试不需要表单可用，只需页面加载
      const targetUrl = resolveContactUrl(test.info());
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

      const loadTime = Date.now() - startTime;

      // 页面加载应该在 5 秒内完成
      expect(loadTime).toBeLessThan(5000);

      console.log(`✅ Contact page loaded in ${loadTime}ms`);
    });

    test("表单字段应该有可读标签和正确输入类型", async ({ page }) => {
      await gotoContactPage(page, test.info());

      const form = page.locator("form").first();
      await expect(form).toBeVisible();

      const fullNameInput = page.getByLabel(/full name/i);
      await expect(fullNameInput).toHaveAttribute("name", "fullName");
      await expect(fullNameInput).toHaveAttribute("type", "text");

      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute("name", "email");
      await expect(emailInput).toHaveAttribute("type", "email");

      const messageInput = page.getByLabel(/message/i);
      await expect(messageInput).toHaveAttribute("name", "message");

      // 隐私改为提交按钮旁的声明式文案（非复选框）：声明可见、指向隐私政策，
      // 且表单内不再有任何 checkbox。
      const privacyNotice = page.getByTestId("form-privacy-notice");
      await expect(privacyNotice).toBeVisible();
      await expect(privacyNotice).toContainText(/privacy policy/i);
      await expect(page.getByRole("checkbox")).toHaveCount(0);
    });
  });

  test.describe("6. 响应式设计", () => {
    test("应该在移动设备上正确显示", async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });

      await gotoContactPage(page, test.info());

      // 检查表单在移动设备上可见
      const form = page.locator("form").first();
      await expect(form).toBeVisible();

      // 检查提交按钮可见
      const submitButton = page.getByRole("button", {
        name: /send inquiry|submit/i,
      });
      await expect(submitButton).toBeVisible();
    });

    test("应该在桌面设备上正确显示", async ({ page }) => {
      // 设置桌面设备视口
      await page.setViewportSize({ width: 1920, height: 1080 });

      await gotoContactPage(page, test.info());

      // 检查表单在桌面设备上可见
      const form = page.locator("form").first();
      await expect(form).toBeVisible();
    });
  });

  test.describe("7. 网络请求验证", () => {
    test("应该正确加载页面资源", async ({ page }) => {
      const failedRequests: string[] = [];

      page.on("requestfailed", (request) => {
        failedRequests.push(request.url());
      });

      // 网络请求验证不需要表单可用
      const targetUrl = resolveContactUrl(test.info());
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

      // 检查是否有失败的关键资源请求
      const criticalFailures = failedRequests.filter(
        (url) =>
          url.includes(".js") || url.includes(".css") || url.includes("api"),
      );

      if (criticalFailures.length > 0) {
        console.warn("⚠️  Failed requests:", criticalFailures);
      }

      // 允许一些非关键资源失败，但关键资源不应失败
      expect(criticalFailures.length).toBeLessThan(3);
    });
  });

  test.describe("8. 交互式表单可用性", () => {
    test("英文页面应该保持真实表单可编辑，而不是只停留在备用壳子", async ({
      page,
    }) => {
      await gotoContactPage(page, test.info());

      await page.fill('input[name="fullName"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('textarea[name="message"]', "Optional test message.");

      const privacyCheckbox = page.getByRole("checkbox", {
        name: /privacy|accept/i,
      });
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }

      await expect(page.locator('input[name="fullName"]')).toHaveValue(
        "Test User",
      );
      await expect(page.locator('input[name="email"]')).toHaveValue(
        "test@example.com",
      );
      await expect(page.locator('textarea[name="message"]')).toHaveValue(
        "Optional test message.",
      );
    });
  });

  test.describe("9. 本地表单填写 smoke 验证", () => {
    test("完整填写后提交入口可见（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info());

      // Local smoke only: Playwright uses test-mode Turnstile and does not submit to the deployed lead pipeline.
      await page.waitForTimeout(2000);

      // 填写完整表单，验证本地 UI 可填写和提交入口可见。
      await page.fill('input[name="fullName"]', "John Doe");
      await page.fill('input[name="email"]', "john.doe@example.com");
      await page.fill(
        'textarea[name="message"]',
        "This is a test message from E2E tests.",
      );

      // 勾选隐私政策 checkbox（必填字段，不勾选会导致表单验证失败）
      const privacyCheckbox = page.getByRole("checkbox", {
        name: /privacy|accept/i,
      });
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }

      // 检查提交入口。本地 smoke 不声明真实提交成功。
      const submitButton = page.getByRole("button", {
        name: /send inquiry|submit/i,
      });
      await expect(submitButton).toBeVisible();
    });
  });
});
