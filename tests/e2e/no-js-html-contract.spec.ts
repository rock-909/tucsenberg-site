import { expect, test } from "@playwright/test";
import { getHeaderMobileMenuButton } from "./helpers/navigation";

const rawBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  process.env.STAGING_URL ??
  "http://localhost:3000";

const BASE_ORIGIN = new URL(rawBaseUrl).origin;

const localeCases = [
  {
    locale: "en",
    skipLabel: "Skip to main content",
    contactHeading: /Contact Us/i,
    languageLabel: "Select Language",
    currentLanguage: "English",
    targetFallbackHref: "/es",
    targetLocale: "es",
    targetHomeHeading:
      /\[ES-TODO\] Replacement membrane paths for installed aeration systems\./i,
    fullNameLabel: "Full name",
    optionalLabel: "optional",
  },
  {
    locale: "es",
    skipLabel: "[ES-TODO] Skip to main content",
    contactHeading: /Contact Us/i,
    languageLabel: "[ES-TODO] Select Language",
    currentLanguage: "Español",
    targetFallbackHref: "/en",
    targetLocale: "en",
    targetHomeHeading:
      /Replacement membrane paths for installed aeration systems\./i,
    fullNameLabel: "[ES-TODO] Full name",
    optionalLabel: "[ES-TODO] optional",
  },
] as const;

function expectExactlyOneMain(html: string) {
  expect((html.match(/<main\b/g) ?? []).length).toBe(1);
}

for (const localeCase of localeCases) {
  test.describe(`No-JS HTML contract (${localeCase.locale})`, () => {
    test.use({ javaScriptEnabled: false });

    test("homepage keeps meaningful structure without client boot", async ({
      page,
    }) => {
      await page.goto(`${BASE_ORIGIN}/${localeCase.locale}`, {
        waitUntil: "domcontentloaded",
      });

      await expect(
        page.getByRole("link", { name: localeCase.skipLabel }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: /main navigation/i }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const html = await page.content();
      expectExactlyOneMain(html);
      expect(html).not.toContain("BAILOUT_TO_CLIENT_SIDE_RENDERING");
      expect(html).toContain('id="main-content"');
    });

    test("mobile homepage exposes navigation fallback without JavaScript", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_ORIGIN}/${localeCase.locale}`, {
        waitUntil: "domcontentloaded",
      });

      const trigger = getHeaderMobileMenuButton(page);
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

      await trigger.click();

      await expect(
        page.getByTestId("header-mobile-navigation-fallback-panel"),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: /mobile navigation menu/i }),
      ).toBeVisible();
      await expect(
        page.getByText(localeCase.languageLabel, { exact: true }),
      ).toBeVisible();
      const languageFallback = page.getByTestId("mobile-language-fallback");
      await expect(languageFallback).toContainText(localeCase.currentLanguage);

      const fallbackPanel = page.getByTestId(
        "header-mobile-navigation-fallback-panel",
      );
      const englishLanguageLink = fallbackPanel.locator(
        'a[hreflang="en"][href="/en"]',
      );
      const spanishLanguageLink = fallbackPanel.locator(
        'a[hreflang="es"][href="/es"]',
      );
      const chineseLanguageLink = fallbackPanel.locator(
        'a[hreflang="zh"][href="/zh"]',
      );

      await expect(englishLanguageLink).toBeHidden();
      await expect(spanishLanguageLink).toBeHidden();
      await expect(chineseLanguageLink).toHaveCount(0);
      await expect(englishLanguageLink).toHaveAttribute("href", "/en");
      await expect(spanishLanguageLink).toHaveAttribute("href", "/es");

      await languageFallback.click();

      await expect(englishLanguageLink).toBeVisible();
      await expect(spanishLanguageLink).toBeVisible();
      await expect(chineseLanguageLink).toHaveCount(0);
    });

    test("mobile language fallback lands on the selected locale root without JavaScript", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_ORIGIN}/${localeCase.locale}/contact`, {
        waitUntil: "domcontentloaded",
      });

      const trigger = getHeaderMobileMenuButton(page);
      await trigger.click();

      const fallbackPanel = page.getByTestId(
        "header-mobile-navigation-fallback-panel",
      );
      const languageFallback = page.getByTestId("mobile-language-fallback");
      await languageFallback.click();

      const targetLanguageLink = fallbackPanel.locator(
        `a[hreflang="${localeCase.targetLocale}"][href="${localeCase.targetFallbackHref}"]`,
      );
      await expect(targetLanguageLink).toBeVisible();

      await targetLanguageLink.click();

      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/${localeCase.targetLocale}`);
      expect(new URL(page.url()).search).toBe("");
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: localeCase.targetHomeHeading,
        }),
      ).toBeVisible();
    });

    test("contact page renders form structure without JavaScript", async ({
      page,
    }) => {
      await page.goto(`${BASE_ORIGIN}/${localeCase.locale}/contact`, {
        waitUntil: "domcontentloaded",
      });

      await expect(
        page.getByRole("link", { name: localeCase.skipLabel }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: /main navigation/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: localeCase.contactHeading }),
      ).toBeVisible();

      const html = await page.content();
      expectExactlyOneMain(html);
      expect(html).toContain('id="main-content"');
      expect(html).toContain("<form");

      const fullNameInput = page.getByLabel(localeCase.fullNameLabel).first();
      const companyInput = page.locator('input[name="company"]').first();
      const submitButton = page.getByRole("button", {
        name: /send message|发送消息/i,
      });

      await expect(fullNameInput).toBeDisabled();
      await expect(fullNameInput).toHaveAttribute("required", "");
      await expect(companyInput).toBeDisabled();
      await expect(companyInput).not.toHaveAttribute("required", "");
      await expect(
        page.getByText(localeCase.optionalLabel, { exact: true }).first(),
      ).toBeVisible();
      await expect(submitButton).toBeDisabled();

      for (const fieldName of [
        "fullName",
        "email",
        "company",
        "message",
        "acceptPrivacy",
      ]) {
        expect(html).toContain(`name="${fieldName}"`);
      }
    });

    test("key localized pages expose one composed main landmark", async ({
      page,
    }) => {
      for (const path of [
        `/${localeCase.locale}/about`,
        `/${localeCase.locale}/products`,
        `/${localeCase.locale}/products/north-america`,
        `/${localeCase.locale}/privacy`,
        `/${localeCase.locale}/terms`,
        `/${localeCase.locale}/custom-project-support`,
      ]) {
        await page.goto(`${BASE_ORIGIN}${path}`, {
          waitUntil: "domcontentloaded",
        });

        expectExactlyOneMain(await page.content());
      }
    });
  });
}
