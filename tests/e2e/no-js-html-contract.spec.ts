import { expect, test } from "@playwright/test";
import { getHeaderMobileMenuButton } from "./helpers/navigation";

const site = {
  skipLabel: "Skip to main content",
  homeHeading: /Factory-Direct Flood Barriers from China/i,
  contactHeading: /Contact/i,
  fullNameLabel: "Full name",
  optionalLabel: "optional",
} as const;

const composedMainPaths = ["/about", "/contact", "/privacy", "/terms"] as const;

function expectExactlyOneMain(html: string) {
  expect((html.match(/<main\b/g) ?? []).length).toBe(1);
}

test.describe("No-JS HTML contract (English-only)", () => {
  test.use({ javaScriptEnabled: false });

  test("homepage keeps meaningful structure without client boot", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("link", { name: site.skipLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /main navigation/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: site.homeHeading }),
    ).toBeVisible();

    const html = await page.content();
    expectExactlyOneMain(html);
    // The static shell must be server-rendered (prerendered), proven by the
    // hero H1 living in the raw HTML string — not injected by client boot.
    // NavigationProgressBar reads useSearchParams under an explicit
    // <Suspense fallback={null}> in [locale]/layout.tsx, so Next.js emits a
    // BAILOUT_TO_CLIENT_SIDE_RENDERING marker for that bounded subtree only.
    // That marker is the officially-sanctioned prerender pattern (installed
    // next docs: use-search-params.md, "Prerendering") — a contained subtree
    // bailout, NOT a whole-page bailout — so we do not assert its absence.
    expect(html).toMatch(site.homeHeading);
    expect(html).toContain('id="main-content"');
  });

  test("mobile homepage exposes English-only navigation fallback without JavaScript", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/", {
      waitUntil: "domcontentloaded",
    });

    const trigger = getHeaderMobileMenuButton(page);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

    await trigger.click();

    const fallbackPanel = page.getByTestId(
      "header-mobile-navigation-fallback-panel",
    );
    await expect(fallbackPanel).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /mobile navigation menu/i }),
    ).toBeVisible();
    await expect(
      fallbackPanel.getByTestId("mobile-language-fallback"),
    ).toHaveCount(0);
    await expect(fallbackPanel.locator('a[hreflang="zh"]')).toHaveCount(0);
    await expect(fallbackPanel.locator('a[href="/zh"]')).toHaveCount(0);
    await expect(fallbackPanel.getByText("简体中文")).toHaveCount(0);
    await expect(fallbackPanel.getByText("中文")).toHaveCount(0);
  });

  test("retired /zh route stays unavailable without JavaScript", async ({
    page,
  }) => {
    const response = await page.goto("http://localhost:3000/zh", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status(), "/zh should return HTTP 404").toBe(404);
    await expect(page.locator("html")).not.toHaveAttribute("lang", "zh");
    await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
    await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
    await expect(page.getByText("简体中文")).toHaveCount(0);
    await expect(page.getByText("中文")).toHaveCount(0);
  });

  test("contact page renders inquiry fallback without JavaScript", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/contact", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("link", { name: site.skipLabel }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /main navigation/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: site.contactHeading }),
    ).toBeVisible();

    const html = await page.content();
    expectExactlyOneMain(html);
    expect(html).toContain('id="main-content"');
    expect(html).toContain('data-testid="contact-form-column"');
    expect(html).toContain('data-testid="inquiry-form-static-fallback"');
    expect(html).not.toMatch(/<form[\s>]/);

    const formColumn = page.locator(
      '#main-content [data-testid="contact-form-column"]',
    );
    const staticFallback = formColumn
      .locator('[data-testid="inquiry-form-static-fallback"]:visible')
      .first();

    await expect(staticFallback).toBeVisible();
    await expect(
      staticFallback.getByText(/secure inquiry form needs JavaScript/i),
    ).toBeVisible();
    await expect(
      staticFallback.getByRole("link", { name: /@/i }),
    ).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
  });

  test("request quote page renders inquiry fallback without JavaScript", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/request-quote", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: /request a quote|get real numbers/i }),
    ).toBeVisible();

    const html = await page.content();
    expect(html).toContain('data-testid="inquiry-form-static-fallback"');
    expect(html).not.toMatch(/<form[\s>]/);

    const staticFallback = page
      .locator('[data-testid="inquiry-form-static-fallback"]:visible')
      .first();

    await expect(staticFallback).toBeVisible();
    await expect(
      staticFallback.getByText(/secure inquiry form needs JavaScript/i),
    ).toBeVisible();
    await expect(
      staticFallback.getByRole("link", { name: /@/i }),
    ).toBeVisible();
    await expect(page.getByRole("button")).toHaveCount(0);
  });

  test("key public pages expose one composed main landmark", async ({
    page,
  }) => {
    for (const path of composedMainPaths) {
      await page.goto(`http://localhost:3000${path}`, {
        waitUntil: "domcontentloaded",
      });

      expectExactlyOneMain(await page.content());
    }
  });

  test("rendered <title> carries exactly one brand suffix", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/products/aluminum-flood-gates", {
      waitUntil: "domcontentloaded",
    });
    const title = await page.title();
    expect(title).toMatch(/\| Tucsenberg$/u);
    expect(title).not.toMatch(/Tucsenberg\s*\|\s*Tucsenberg/u);
  });
});
