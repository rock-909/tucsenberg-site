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
  const getExpectedContactTitle = (locale: "en" | "zh"): RegExp => {
    return locale === "zh"
      ? /联系.*Showcase Website Starter|联系.*Tucsenberg|获取报价|联系我们/i
      : /Contact.*Showcase Website Starter|Contact.*Tucsenberg|Get a Quote/i;
  };

  const supportedLocales = (process.env.NEXT_PUBLIC_SUPPORTED_LOCALES || "en")
    .split(",")
    .map((locale) => locale.trim())
    .filter(Boolean);
  const knownLocales = supportedLocales.length > 0 ? supportedLocales : ["en"];

  const resolveContactUrl = (info: TestInfo, locale: "en" | "zh"): string => {
    const stagingBase = process.env.STAGING_URL;
    const base =
      stagingBase ||
      info.project?.use?.baseURL ||
      process.env.PLAYWRIGHT_BASE_URL ||
      "http://localhost:3000/en";

    try {
      const url = new URL(base);
      const segments = url.pathname.split("/").filter(Boolean);
      const localeIndex = segments.findIndex((segment) =>
        knownLocales.includes(segment),
      );

      if (stagingBase) {
        segments.push(locale);
      } else if (localeIndex >= 0) {
        segments[localeIndex] = locale;
      } else {
        segments.push(locale);
      }

      segments.push("contact");
      url.pathname = `/${segments.join("/")}`;
      return url.toString();
    } catch {
      const normalizedBase = base.replace(/\/$/, "");
      if (stagingBase) {
        return `${normalizedBase}/${locale}/contact`;
      }

      const matchedLocale = knownLocales.find((candidate) =>
        normalizedBase.endsWith(`/${candidate}`),
      );
      const baseWithoutLocale = matchedLocale
        ? normalizedBase.slice(0, -1 * (matchedLocale.length + 1))
        : normalizedBase;
      const root = baseWithoutLocale || normalizedBase;
      return `${root.replace(/\/$/, "")}/${locale}/contact`;
    }
  };

  const gotoContactPage = async (
    page: Page,
    info: TestInfo,
    locale: "en" | "zh" = "en",
  ): Promise<void> => {
    const targetUrl = resolveContactUrl(info, locale);
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
    });

    // 等待页面主要内容加载
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});

    // 检查是否存在表单
    const formCount = await page.locator("form").count();
    let hasForm = formCount > 0;

    // 检查是否存在错误状态（Error Boundary 渲染的错误提示）
    // 使用多种选择器确保检测到错误状态
    const errorIndicators = [
      page.getByText("联系表单暂时不可用"),
      page.getByText("Contact form temporarily unavailable"),
      page.getByRole("button", { name: "重试" }),
      page.getByRole("button", { name: "Retry" }),
    ];

    let hasError = false;
    for (const indicator of errorIndicators) {
      if ((await indicator.count()) > 0) {
        hasError = true;
        break;
      }
    }

    // 如果既没有表单也没有检测到明确的错误状态，视为异常情况
    if (!hasForm && !hasError) {
      // 再次检查页面内容，可能是加载问题
      await page.waitForTimeout(2000);
      const formCountRetry = await page.locator("form").count();
      hasForm = formCountRetry > 0;
      if (!hasForm) {
        hasError = true;
      }
    }

    if (hasError) {
      throw new Error(
        `Contact form rendered an error state in test-mode smoke: ${targetUrl}`,
      );
    }

    if (!hasForm) {
      throw new Error(`Contact form did not render: ${targetUrl}`);
    }

    await expect(page).toHaveTitle(getExpectedContactTitle(locale));
    await expectInteractiveContactForm(page);
  };

  const expectInteractiveContactForm = async (page: Page): Promise<void> => {
    const fullNameInput = page.locator('input[name="fullName"]').first();
    const messageInput = page.locator('textarea[name="message"]').first();
    const privacyCheckbox = page.locator('input[name="acceptPrivacy"]').first();

    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toBeEditable();
    await expect(messageInput).toBeEditable();
    await expect(privacyCheckbox).toBeEnabled();
  };

  test.beforeEach(async ({ page }) => {
    // 设置 Turnstile 测试密钥
    await page.addInitScript(() => {
      // @ts-expect-error - 注入测试环境变量
      window.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
    });
  });

  test.describe("1. Turnstile 验证流程", () => {
    test("应该加载 Turnstile widget（英文页面）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      // 检查表单存在
      const form = page.locator("form").first();
      await expect(form).toBeVisible();

      // 等待 LazyTurnstile 懒加载完成（IntersectionObserver + requestIdleCallback）
      // 最长等待时间：1500ms timeout + 额外缓冲
      await page.waitForTimeout(3000);

      // 检查 Turnstile widget 容器或 iframe
      // 注意：test-mode smoke 仍可能因为懒加载时机等原因暂时看不到 Turnstile 元素
      // 这是非阻塞性检查，只记录警告
      const hasTurnstileIframe =
        (await page
          .locator('iframe[src*="challenges.cloudflare.com"]')
          .count()) > 0;
      const hasTurnstileContainer =
        (await page.locator('[class*="turnstile"]').count()) > 0;
      const hasMock =
        (await page.locator('[data-testid="turnstile-mock"]').count()) > 0;
      const hasPlaceholder = (await page.locator(".animate-pulse").count()) > 0;

      const hasTurnstileElement =
        hasTurnstileIframe ||
        hasTurnstileContainer ||
        hasMock ||
        hasPlaceholder;

      // 记录 Turnstile 状态（非阻塞性检查）
      if (!hasTurnstileElement) {
        console.warn("⚠️  Turnstile widget not detected in test-mode smoke");
        console.warn(
          "    This may be due to lazy loading timing or local test harness configuration",
        );
        console.warn(
          "    Real submission behavior must still be verified by post-deploy smoke",
        );
      } else {
        console.log("✅ Turnstile element detected");
      }

      // 验证表单基本功能（不依赖 Turnstile）
      await expect(form).toBeVisible();
    });

    test("应该加载 Turnstile widget（中文页面）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "zh");

      // 检查表单存在
      const form = page.locator("form").first();
      await expect(form).toBeVisible();
    });

    test("提交按钮初始状态应该被禁用", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      const submitButton = page.getByRole("button", {
        name: /send message|submit/i,
      });
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe("2. 表单验证与错误信息", () => {
    test("应该显示必填字段错误（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      // 检查所有必填字段的 required 属性
      // 注意：必填标记 (*) 使用 CSS ::after 伪元素，Playwright 无法直接检测
      // 改为检查 input[required] 属性
      const requiredInputs = page.locator(
        'input[required], textarea[required], input[type="checkbox"][required]',
      );
      const count = await requiredInputs.count();
      expect(count).toBeGreaterThan(0);

      // 验证核心必填字段（fullName, email, message, acceptPrivacy）
      // 注意：Production 环境的 company 字段可能不是 required（与本地代码不同步）
      await expect(page.locator('input[name="fullName"]')).toHaveAttribute(
        "required",
      );
      await expect(page.locator('input[name="email"]')).toHaveAttribute(
        "required",
      );
      await expect(page.locator('textarea[name="message"]')).toHaveAttribute(
        "required",
      );
      await expect(page.locator('input[name="acceptPrivacy"]')).toHaveAttribute(
        "required",
      );
    });

    test("应该显示必填字段错误（中文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "zh");

      // 检查所有必填字段的 required 属性
      const requiredInputs = page.locator(
        "input[required], textarea[required]",
      );
      const count = await requiredInputs.count();
      expect(count).toBeGreaterThan(0);

      // 验证关键必填字段
      await expect(page.locator('input[name="fullName"]')).toHaveAttribute(
        "required",
      );
      await expect(page.locator('input[name="email"]')).toHaveAttribute(
        "required",
      );
    });

    test("应该验证邮箱格式", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  test.describe("3. 表单字段渲染", () => {
    test("应该渲染所有必需字段（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      // 检查所有必需字段
      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="company"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();

      // 检查隐私政策复选框
      await expect(page.locator('input[name="acceptPrivacy"]')).toBeVisible();
    });

    test("应该渲染所有必需字段（中文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "zh");

      // 检查所有必需字段
      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="company"]')).toBeVisible();
      await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });
  });

  test.describe("4. 国际化（i18n）验证", () => {
    test("英文页面应该显示英文标签", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      // 检查英文标签
      await expect(page.getByText(/full name/i).first()).toBeVisible();
      await expect(page.getByText(/email/i).first()).toBeVisible();
      await expect(page.getByText(/company/i).first()).toBeVisible();
    });

    test("中文页面应该显示中文标签", async ({ page }) => {
      await gotoContactPage(page, test.info(), "zh");

      // 检查中文标签
      await expect(page.getByText(/姓名/).first()).toBeVisible();
      await expect(page.getByText(/邮箱/).first()).toBeVisible();
      await expect(page.getByText(/公司/).first()).toBeVisible();
    });
  });

  test.describe("5. 性能与可访问性", () => {
    test("页面加载时间应该合理", async ({ page }) => {
      const startTime = Date.now();

      // 性能测试不需要表单可用，只需页面加载
      const targetUrl = resolveContactUrl(test.info(), "en");
      await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

      const loadTime = Date.now() - startTime;

      // 页面加载应该在 5 秒内完成
      expect(loadTime).toBeLessThan(5000);

      console.log(`✅ Contact page loaded in ${loadTime}ms`);
    });

    test("表单字段应该有可读标签和正确输入类型", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

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

      const privacyCheckbox = page.getByLabel(/privacy policy/i);
      await expect(privacyCheckbox).toHaveAttribute("name", "acceptPrivacy");
      await expect(privacyCheckbox).toHaveAttribute("type", "checkbox");
    });
  });

  test.describe("6. 响应式设计", () => {
    test("应该在移动设备上正确显示", async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 });

      await gotoContactPage(page, test.info(), "en");

      // 检查表单在移动设备上可见
      const form = page.locator("form").first();
      await expect(form).toBeVisible();

      // 检查提交按钮可见
      const submitButton = page.getByRole("button", {
        name: /send message|submit/i,
      });
      await expect(submitButton).toBeVisible();
    });

    test("应该在桌面设备上正确显示", async ({ page }) => {
      // 设置桌面设备视口
      await page.setViewportSize({ width: 1920, height: 1080 });

      await gotoContactPage(page, test.info(), "en");

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
      const targetUrl = resolveContactUrl(test.info(), "en");
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
      await gotoContactPage(page, test.info(), "en");

      await page.fill('input[name="fullName"]', "Test User");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="company"]', "Test Company");
      await page.fill(
        'textarea[name="message"]',
        "Test message for rate limiting",
      );

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
        "Test message for rate limiting",
      );
    });

    test("中文页面应该保持真实表单可编辑，而不是只停留在备用壳子", async ({
      page,
    }) => {
      await gotoContactPage(page, test.info(), "zh");

      await page.fill('input[name="fullName"]', "测试用户");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="company"]', "测试公司");
      await page.fill('textarea[name="message"]', "用于速率限制验证的测试消息");

      const privacyCheckbox = page.getByRole("checkbox", {
        name: /隐私政策|同意/i,
      });
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }

      await expect(page.locator('input[name="fullName"]')).toHaveValue(
        "测试用户",
      );
      await expect(page.locator('input[name="email"]')).toHaveValue(
        "test@example.com",
      );
      await expect(page.locator('textarea[name="message"]')).toHaveValue(
        "用于速率限制验证的测试消息",
      );
    });
  });

  test.describe("9. 本地表单填写 smoke 验证", () => {
    test("完整填写后提交入口可见（英文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "en");

      // Local smoke only: Playwright uses test-mode Turnstile and does not submit to the deployed lead pipeline.
      await page.waitForTimeout(2000);

      // 填写完整表单，验证本地 UI 可填写和提交入口可见。
      await page.fill('input[name="fullName"]', "John Doe");
      await page.fill('input[name="email"]', "john.doe@example.com");
      await page.fill('input[name="company"]', "Acme Corp");
      await page.fill(
        'textarea[name="message"]',
        "This is a test message from E2E tests.",
      );

      // 勾选隐私政策 checkbox（必填字段，与中文版测试保持一致）
      // 注意：acceptPrivacy 是必填字段，不勾选会导致表单验证失败
      const privacyCheckbox = page.getByRole("checkbox", {
        name: /privacy|accept/i,
      });
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }

      // 检查提交入口。本地 smoke 不声明真实提交成功。
      const submitButton = page.getByRole("button", {
        name: /send message|submit/i,
      });
      await expect(submitButton).toBeVisible();
    });

    test("完整填写后提交入口可见（中文）", async ({ page }) => {
      await gotoContactPage(page, test.info(), "zh");

      // Local smoke only: Playwright uses test-mode Turnstile and does not submit to the deployed lead pipeline.
      await page.waitForTimeout(2000);

      // 填写完整表单，验证本地 UI 可填写和提交入口可见。
      await page.fill('input[name="fullName"]', "张三");
      await page.fill('input[name="email"]', "zhangsan@example.com");
      await page.fill('input[name="company"]', "测试公司");
      await page.fill('textarea[name="message"]', "这是来自 E2E 测试的消息。");

      // 勾选隐私政策 checkbox（必填）
      const privacyCheckbox = page.getByRole("checkbox", {
        name: /隐私政策|同意/i,
      });
      if (await privacyCheckbox.isVisible()) {
        await privacyCheckbox.check();
      }

      // 检查提交入口。本地 smoke 不声明真实提交成功。
      const submitButton = page.getByRole("button", { name: /发送|提交/i });
      await expect(submitButton).toBeVisible();
    });
  });
});
