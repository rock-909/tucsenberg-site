import type { Page } from "@playwright/test";

type LocatorClickOptions = Parameters<ReturnType<Page["locator"]>["click"]>[0];

// import { FullConfig } from '@playwright/test'; // TODO: Use when needed

/**
 * 测试环境设置
 *
 * 专门为 E2E 测试配置环境，确保测试工具之间不会相互干扰
 */

/**
 * 禁用开发工具的环境变量设置
 */
const TEST_ENV_VARS = {
  // 设置测试环境标识
  NODE_ENV: "test",
  PLAYWRIGHT_TEST: "true",

  // 禁用可能干扰测试的监控工具
  NEXT_PUBLIC_DISABLE_PERFORMANCE_MONITOR: "true",

  // 测试专用配置
  NEXT_PUBLIC_TEST_MODE: "true",
} as const;

const INTERFERING_SELECTORS = [] as const;

/**
 * 为测试环境配置环境变量
 */
export function setupTestEnvironment() {
  console.log("🧪 Setting up test environment...");

  // 设置测试环境变量
  Object.entries(TEST_ENV_VARS).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`   ${key}=${value}`);
  });

  console.log("✅ Test environment configured");
}

/**
 * 清理测试环境
 */
export function cleanupTestEnvironment() {
  console.log("🧹 Cleaning up test environment...");

  // 清理测试环境变量（可选）
  Object.keys(TEST_ENV_VARS).forEach((key) => {
    delete process.env[key];
  });

  console.log("✅ Test environment cleaned up");
}

/**
 * 在页面上安装持续的干扰元素清理器，避免工具栏/覆盖层在测试过程中反复回流。
 */
export async function installInterferenceGuard(page: Page) {
  if (INTERFERING_SELECTORS.length === 0) {
    return;
  }

  await page.addInitScript((selectors: readonly string[]) => {
    const removeMatches = () => {
      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach((node) => node.remove());
      }
    };

    removeMatches();

    const observer = new MutationObserver(() => {
      observer.disconnect();
      removeMatches();
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });

    const start = () => {
      removeMatches();
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }

    window.addEventListener("beforeunload", () => observer.disconnect(), {
      once: true,
    });
  }, INTERFERING_SELECTORS);
}

/**
 * 检查页面是否存在干扰元素
 */
async function checkForInterferingElements(page: Page) {
  const foundElements: string[] = [];

  for (const selector of INTERFERING_SELECTORS) {
    try {
      const element = await page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        foundElements.push(selector);
      }
    } catch {
      // 忽略查找错误
    }
  }

  if (foundElements.length > 0) {
    console.warn("⚠️  Found interfering elements:", foundElements);
    return foundElements;
  }

  return [];
}

/**
 * 移除页面中的干扰元素
 */
export async function removeInterferingElements(page: Page) {
  console.log("🧹 Removing interfering elements...");

  for (const selector of INTERFERING_SELECTORS) {
    try {
      await page.evaluate((sel: string) => {
        const elements = document.querySelectorAll(sel);
        elements.forEach((el) => el.remove());
      }, selector);
    } catch {
      // 忽略移除错误
    }
  }

  console.log("✅ Interfering elements removed");
}

/**
 * 等待页面稳定（无干扰元素）
 */
export async function waitForStablePage(page: Page, timeout = 5000) {
  console.log("⏳ Waiting for page to stabilize...");

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const interferingElements = await checkForInterferingElements(page);

    if (interferingElements.length === 0) {
      console.log("✅ Page is stable");
      return true;
    }

    // 尝试移除干扰元素
    await removeInterferingElements(page);

    // 等待一小段时间再检查
    await page.waitForTimeout(100);
  }

  console.warn("⚠️  Page did not stabilize within timeout");
  return false;
}

interface WaitForLoadOptions {
  loadTimeout?: number;
  fallbackDelay?: number;
  context?: string;
}

/**
 * 等待页面 load 状态，若超时则降级为短暂延时，避免 networkidle 阻塞
 */
export async function waitForLoadWithFallback(
  page: Page,
  options: WaitForLoadOptions = {},
) {
  const { loadTimeout = 5_000, fallbackDelay = 1_000, context } = options;

  try {
    await page.waitForLoadState("load", { timeout: loadTimeout });
  } catch (error) {
    console.warn(
      `⚠️ waitForLoadState("load") timed out${
        context ? ` (${context})` : ""
      }, falling back to ${fallbackDelay}ms delay`,
      error instanceof Error ? error.message : error,
    );
    await page.waitForTimeout(fallbackDelay);
  }
}

/**
 * Close the cookie banner in flows where it is not the behavior under test.
 */
export async function acceptCookieBannerIfVisible(page: Page): Promise<void> {
  const cookieDialog = page.getByRole("dialog", { name: /cookie/i });

  if (!(await cookieDialog.isVisible({ timeout: 3_000 }).catch(() => false))) {
    return;
  }

  const acceptButton = cookieDialog.getByRole("button", {
    name: /accept|全部接受/i,
  });

  if (!(await acceptButton.isVisible({ timeout: 2_000 }).catch(() => false))) {
    return;
  }

  await acceptButton.click();
  await cookieDialog.waitFor({ state: "hidden", timeout: 5_000 });
}

/**
 * 安全点击元素（避免干扰）
 * 使用 .first() 确保只操作第一个匹配的元素，避免 strict mode violation
 */
export async function safeClick(
  page: Page,
  selector: string,
  options?: LocatorClickOptions,
) {
  console.log(`🖱️  Safe clicking: ${selector}`);

  // 首先移除干扰元素
  await removeInterferingElements(page);

  // 等待元素可见
  await page.waitForSelector(selector, { state: "visible", timeout: 5000 });

  // 使用 .first() 确保只操作第一个匹配的元素
  const targetElement = page.locator(selector).first();

  // 滚动到元素位置
  await targetElement.scrollIntoViewIfNeeded();

  // 等待元素稳定
  await page.waitForTimeout(100);

  // 再次检查并移除干扰元素
  await removeInterferingElements(page);

  try {
    // 尝试点击
    await targetElement.click(options);
    console.log(`✅ Successfully clicked: ${selector}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Click failed for ${selector}:`, (error as Error).message);

    // 尝试使用 JavaScript 点击
    try {
      await page.evaluate((sel: string) => {
        const element = document.querySelector(sel);
        if (element) {
          (element as HTMLElement).click();
        }
      }, selector);
      console.log(`✅ JavaScript click succeeded: ${selector}`);
      return true;
    } catch {
      console.error(`❌ Both click methods failed for ${selector}`);
      return false;
    }
  }
}
