import { chromium, type FullConfig } from "@playwright/test";
import {
  installInterferenceGuard,
  removeInterferingElements,
  setupTestEnvironment,
  waitForStablePage,
} from "./test-environment-setup";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for Playwright tests...");

  // 设置测试环境变量
  setupTestEnvironment();

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await installInterferenceGuard(page);

  try {
    // 如果设置了 STAGING_URL，使用它；否则使用 baseURL
    const stagingURL = process.env.STAGING_URL;
    const baseURL =
      stagingURL ||
      config.projects?.[0]?.use?.baseURL ||
      process.env.PLAYWRIGHT_BASE_URL ||
      "http://localhost:3000";

    console.log(`⏳ Waiting for server at ${baseURL}...`);

    // 如果是 staging URL，跳过服务器健康检查（假设已部署）
    if (stagingURL) {
      console.log("✅ Using staging URL, skipping local server check");
    } else {
      await page.goto(baseURL, { waitUntil: "networkidle" });

      // 移除可能的干扰元素
      await removeInterferingElements(page);

      // 等待页面稳定
      await waitForStablePage(page);

      console.log("✅ Server is ready and page is stable");
    }

    // Perform any global setup tasks here
    // For example: login, seed data, etc.
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("✅ Global setup completed");
}

export default globalSetup;
