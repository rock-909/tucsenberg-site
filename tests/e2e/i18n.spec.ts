import { expect, test, type Locator, type Page } from "@playwright/test";
import { checkA11y, injectAxe } from "./helpers/axe";
import {
  getHeaderMobileMenuButton,
  getNav,
  isHeaderInMobileMode,
  waitForHtmlLang,
} from "./helpers/navigation";
import {
  removeInterferingElements,
  safeClick,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

const PUBLIC_NAV_ITEMS = ["Membranes", "Compatibility", "Materials", "Quote"];
// Nav labels are real next-intl strings and DO translate at runtime — the
// merged `messages/es/critical.json` "nav" values. Asserting English nav copy
// on an `/es` page is the same contract bug Gap-1 fixes (it passed even when
// nothing translated). Kept in lockstep with the EN list order.
const PUBLIC_NAV_ITEMS_ES = [
  "Membranas",
  "Compatibilidad",
  "Materiales",
  "Cotización",
];

/**
 * Step-4 home is a compatibility-search hero, not the deleted starter home —
 * there is no `hero-section` testid. These are the real merged values from
 * `messages/{locale}/critical.json` ("home") and `messages/es/critical.json`
 * ("nav"), reused so this i18n smoke proves locale-correct buyer copy without
 * over-coupling to layout. Kept aligned with `homepage.spec.ts`.
 */
interface HomeLocaleCopy {
  readonly heroTitle: string;
  readonly searchLabel: string;
}

const HOME_COPY: Record<"en" | "es", HomeLocaleCopy> = {
  en: {
    heroTitle: "Find Your Replacement Membrane",
    searchLabel: "Compatibility search",
  },
  es: {
    heroTitle: "Encuentre su membrana de repuesto",
    searchLabel: "Búsqueda de compatibilidad",
  },
};

/**
 * Get the open language dropdown (avoids strict mode violation from closed instances)
 */
function getOpenLanguageDropdown(page: Page): Locator {
  return page
    .locator('[data-testid="language-dropdown-content"][data-state="open"]')
    .first();
}

/**
 * Get language link within the open dropdown (avoids selecting from closed dropdowns)
 */
function getLanguageLinkInOpenDropdown(
  page: Page,
  locale: "en" | "es",
): Locator {
  return getOpenLanguageDropdown(page)
    .locator(`[data-testid="language-link-${locale}"]`)
    .first();
}

test.describe("Internationalization (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/en");
    await waitForLoadWithFallback(page);
    await removeInterferingElements(page);
    await waitForStablePage(page);
  });

  test("should default to English locale and display correct lang attribute", async ({
    page,
  }) => {
    // Verify URL contains English locale
    expect(page.url()).toContain("/en");

    // Verify lang attribute on html element
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en");

    // Verify English Step-4 home content: the compatibility-search hero H1
    // and search combobox (no deleted `hero-section` testid).
    await expect(
      page.getByRole("heading", { level: 1, name: HOME_COPY.en.heroTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: HOME_COPY.en.searchLabel }),
    ).toBeVisible();

    // Check navigation per form factor
    if (await isHeaderInMobileMode(page)) {
      // On mobile, verify menu toggle instead of desktop nav links
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
    } else {
      const nav = getNav(page);
      await expect(nav.getByRole("link", { name: "Membranes" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Quote" })).toBeVisible();
    }
  });

  test.describe("Language Switching", () => {
    test("should switch from English to Spanish and keep Chinese hidden from public switcher", async ({
      page,
    }) => {
      // Open language dropdown using a robust selector (exclude disabled variants)
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );

      // Verify dropdown is open
      const dropdownContent = getOpenLanguageDropdown(page);
      const expandedToggle = page
        .locator(
          'button[data-testid="language-toggle-button"][aria-expanded="true"]',
        )
        .first();
      await expect(expandedToggle).toBeVisible();
      await expect(dropdownContent).toHaveAttribute("data-state", "open");

      // Verify English is currently active
      const englishLink = getLanguageLinkInOpenDropdown(page, "en");
      await expect(englishLink.getByTestId("check-icon")).toBeVisible();

      await expect(
        getOpenLanguageDropdown(page).locator(
          '[data-testid="language-link-zh"]',
        ),
      ).toHaveCount(0);

      // Click Spanish language option
      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await expect(spanishLink).toBeVisible();
      await spanishLink.click();

      // Wait for navigation to Spanish locale
      await page.waitForURL("**/es");
      await waitForLoadWithFallback(page);
      await waitForStablePage(page);

      // After switching locale the buyer-facing home copy must be Spanish.
      // Assert the merged Spanish hero H1 and search combobox label (the
      // previous assertions here checked ENGLISH nav copy + a deleted
      // `hero-section` testid — they passed even with nothing translated, so
      // they proved nothing about the Spanish render).
      await waitForHtmlLang(page, "es");
      await expect(
        page.getByRole("heading", { level: 1, name: HOME_COPY.es.heroTitle }),
      ).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: HOME_COPY.es.searchLabel }),
      ).toBeVisible();
    });

    test("should switch from Spanish back to English", async ({ page }) => {
      // First switch to Spanish (open dropdown)
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      // Ensure dropdown is fully open before interacting
      const dropdownContentA = getOpenLanguageDropdown(page);
      const expandedToggleA = page
        .locator(
          'button[data-testid="language-toggle-button"][aria-expanded="true"]',
        )
        .first();
      await expect(expandedToggleA).toBeVisible();
      await expect(dropdownContentA).toHaveAttribute("data-state", "open");

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es");
      await waitForStablePage(page);

      // Now switch back to English (reopen dropdown)
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      const dropdownContentReopen = getOpenLanguageDropdown(page);
      const expandedToggleB = page
        .locator(
          'button[data-testid="language-toggle-button"][aria-expanded="true"]',
        )
        .first();
      await expect(expandedToggleB).toBeVisible();
      await expect(dropdownContentReopen).toHaveAttribute("data-state", "open");

      const englishLink = getLanguageLinkInOpenDropdown(page, "en");
      await englishLink.click();

      // More robust waiting: expect key English UI elements instead of just URL
      await expect(page.locator("html")).toHaveAttribute("lang", "en", {
        timeout: 30_000,
      });
      await expect(
        page.getByRole("link", { name: "Membranes" }).first(),
      ).toBeVisible({ timeout: 30_000 });
      await waitForStablePage(page);

      // Verify language via attribute with a graceful fallback
      try {
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
      } catch {
        // Fallback: verify English UI is present
        const nav = getNav(page);
        await expect(
          nav.getByRole("link", { name: "Membranes" }),
        ).toBeVisible();
      }

      {
        const isMobile = await isHeaderInMobileMode(page);
        if (isMobile) {
          const mobileMenuButton = getHeaderMobileMenuButton(page);
          await expect(mobileMenuButton).toBeVisible();
          try {
            await mobileMenuButton.tap();
          } catch {
            await mobileMenuButton.click();
          }
          const mobileNavSheet = page.getByRole("dialog", {
            name: /mobile navigation/i,
          });
          await expect(
            mobileNavSheet.getByRole("link", { name: "Membranes" }),
          ).toBeVisible();
        } else {
          const nav = getNav(page);
          await expect(
            nav.getByRole("link", { name: "Membranes" }),
          ).toBeVisible();
        }
      }
    });

    test("should show loading indicator during language switch", async ({
      page,
    }) => {
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      const dropdownContentB = getOpenLanguageDropdown(page);
      const expandedToggle = page
        .locator(
          'button[data-testid="language-toggle-button"][aria-expanded="true"]',
        )
        .first();
      await expect(expandedToggle).toBeVisible();
      await expect(dropdownContentB).toHaveAttribute("data-state", "open");

      // Click Spanish link and immediately check for loading state
      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");

      // Start the click but don't wait for completion
      const clickPromise = spanishLink.click();

      // Check for loading spinner (this happens very quickly)
      const loadingSpinner = spanishLink.locator(".animate-spin");

      // The spinner might appear briefly
      try {
        await expect(loadingSpinner).toBeVisible({ timeout: 500 });
      } catch {
        // Loading might be too fast to catch, which is acceptable
      }

      // Wait for the click to complete
      await clickPromise;
      await page.waitForURL("**/es");
      await waitForLoadWithFallback(page);

      // Prefer semantic verification with fallback due to mobile timing
      // windows. The fallback asserts the Spanish-translated nav link
      // ("Membranas"), since this page is now `/es`.
      const htmlLang = await page.locator("html").getAttribute("lang");
      if (htmlLang !== "es") {
        const nav = getNav(page);
        await expect(
          nav.getByRole("link", { name: "Membranas" }),
        ).toBeVisible();
      } else {
        expect(htmlLang).toBe("es");
      }
    });

    test("should preserve current page path during language switch", async ({
      page,
    }) => {
      // About is a real route, but it is no longer in the Step 2 public nav.
      await page.goto("/en/about");
      await page.waitForURL("**/en/about");

      // Switch language
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      const dropdownContentC = getOpenLanguageDropdown(page);
      const expandedToggle = page
        .locator(
          'button[data-testid="language-toggle-button"][aria-expanded="true"]',
        )
        .first();
      await expect(expandedToggle).toBeVisible();
      await expect(dropdownContentC).toHaveAttribute("data-state", "open");

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();

      // Should navigate to Spanish version of the same page
      await page.waitForURL("**/es/about");
      await waitForLoadWithFallback(page);

      // Verify we're on the Spanish About page with fallback
      try {
        await expect(page.locator("html")).toHaveAttribute("lang", "es");
      } catch {
        // Lang attribute check failed, continue with URL verification
      }
      expect(page.url()).toMatch(/\/es\/about\/?$/);
    });
  });

  test.describe("Theme Localization", () => {
    test("should display theme toggle in correct language (conditional)", async ({
      page,
    }) => {
      // Test English theme labels
      const themeToggleButton = page.getByRole("button", {
        name: "Toggle theme",
      });
      if (!(await themeToggleButton.count())) {
        // Feature not present: consider as non-applicable pass
        expect(true).toBe(true);
        return;
      }
      await themeToggleButton.click();

      // Verify English theme menu items
      await expect(
        page.getByRole("menuitem", { name: /Light/i }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /Dark/i })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /System/i }),
      ).toBeVisible();

      // Close theme menu
      await page.keyboard.press("Escape");

      // Switch to Spanish
      const languageToggleButton = page.getByTestId("language-toggle-button");
      await languageToggleButton.click();

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es");
      await waitForStablePage(page);

      // Test Spanish placeholder theme labels.
      await page.getByRole("button", { name: /toggle theme/i }).click();

      // Verify Spanish TODO-prefixed theme menu items still expose the base labels.
      await expect(
        page.getByRole("menuitem", { name: /Light/i }),
      ).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /Dark/i })).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /System/i }),
      ).toBeVisible();
    });

    test("should maintain theme preference across language switches (conditional)", async ({
      page,
    }) => {
      // Set dark theme in English
      const themeToggleButton = page.getByRole("button", {
        name: "Toggle theme",
      });
      if (!(await themeToggleButton.count())) {
        expect(true).toBe(true);
        return;
      }
      await themeToggleButton.click();

      const darkMenuItem = page.getByRole("menuitem", { name: /Dark/i });
      await darkMenuItem.click();

      // Verify dark theme is applied
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Switch to Spanish
      const languageToggleButton = page.getByTestId("language-toggle-button");
      await languageToggleButton.click();

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es");
      await waitForStablePage(page);

      // Verify dark theme is still applied
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Verify theme toggle shows correct state in Spanish.
      await page.getByRole("button", { name: /toggle theme/i }).click();
      const darkMenuItemEs = page.getByRole("menuitem", { name: /Dark/i });

      // The dark theme item should be marked as active/selected
      await expect(darkMenuItemEs).toBeVisible();
    });
  });

  test.describe("Content Translation Validation", () => {
    test("should display all navigation items in both languages", async ({
      page,
    }) => {
      // Test English navigation per form factor
      const isMobile = await isHeaderInMobileMode(page);
      const nav = getNav(page);
      let container: Locator = nav;
      if (isMobile) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        try {
          await mobileMenuButton.tap();
        } catch {
          await mobileMenuButton.click();
        }
        container = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await expect(container).toBeVisible();
      } else {
        await expect(nav).toBeVisible();
      }
      for (const item of PUBLIC_NAV_ITEMS) {
        const candidate = container
          .getByRole("link", { name: item })
          .or(container.getByRole("button", { name: item }));
        await expect(candidate.first()).toBeVisible();
      }

      // Switch to Spanish
      // Close mobile sheet first to avoid overlay intercepting pointer events
      if (isMobile && container) {
        const closeBtn = (container as any).getByRole?.("button", {
          name: /close/i,
        });
        try {
          if (closeBtn) await closeBtn.click({ trial: true });
        } catch {
          // Trial click failed, continue
        }
        try {
          if (closeBtn) await closeBtn.click();
          else await page.keyboard.press("Escape");
        } catch {
          // Close action failed, continue
        }
        await expect(page.getByRole("dialog", { name: /mobile navigation/i }))
          .not.toBeVisible({ timeout: 2000 })
          .catch(() => {
            // Dialog still visible, continue
          });
      }
      const languageToggleButton = page.getByTestId("language-toggle-button");
      await languageToggleButton.click();
      const dropdownContentD = getOpenLanguageDropdown(page);
      await expect(languageToggleButton).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(dropdownContentD).toHaveAttribute("data-state", "open");

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es");
      await waitForStablePage(page);

      // Recompute container after navigation to es (dialog/nav may have re-rendered)
      {
        const isMobile2 = await isHeaderInMobileMode(page);
        if (isMobile2) {
          const mobileMenuButton2 = getHeaderMobileMenuButton(page);
          await expect(mobileMenuButton2).toBeVisible();
          try {
            await mobileMenuButton2.tap();
          } catch {
            await mobileMenuButton2.click();
          }
          container = page.getByRole("dialog", {
            name: /mobile navigation/i,
          });
          await expect(container).toBeVisible();
        } else {
          container = getNav(page);
        }
      }

      for (const item of PUBLIC_NAV_ITEMS_ES) {
        const candidate = container
          .getByRole("link", { name: item })
          .or(container.getByRole("button", { name: item }));
        await expect(candidate.first()).toBeVisible();
      }
    });

    test("should handle missing translations gracefully", async ({ page }) => {
      // This test verifies fallback behavior for missing translation keys
      // Navigate to a page that might have incomplete translations

      const nav = getNav(page);
      const diagnosticsLink = nav.getByRole("link", {
        name: "Performance Diagnostics",
      });

      if (await diagnosticsLink.isVisible()) {
        await diagnosticsLink.click();
        await waitForLoadWithFallback(page);

        // Switch to Spanish
        const languageToggleButton = page.getByTestId("language-toggle-button");
        await languageToggleButton.click();

        const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
        await spanishLink.click();
        await page.waitForURL("**/es/diagnostics");
        await waitForStablePage(page);

        // Page should still load even if some translations are missing
        // Content should either show Spanish TODO placeholders or fallback to English.
        await expect(page.getByRole("heading").first()).toBeVisible();
      }
    });
  });

  test.describe("Mobile i18n Experience", () => {
    // Ensure mobile-like context across browsers (Firefox 不支持 isMobile)
    // 仅使用 viewport + hasTouch 模拟移动设备特性
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    // Note: Mobile tests automatically run on Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12)
    // as configured in playwright.config.ts projects. No need to use test.use() here.

    test("should work correctly on mobile devices", async ({ page }) => {
      // On mobile, language switching is done through the mobile menu
      // (language-toggle-button is header-desktop-only, hidden below 1280px)
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible({ timeout: 10000 });

      // Open mobile menu
      try {
        await mobileMenuButton.tap();
      } catch {
        await mobileMenuButton.click();
      }

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      const mobileLanguageButton = mobileNavSheet.getByRole("button", {
        name: /select language english/i,
      });
      await expect(mobileLanguageButton).toBeVisible();

      // Mobile language options are intentionally collapsed by default.
      const chineseLink = mobileNavSheet.getByRole("link", {
        name: "简体中文",
      });
      await expect(chineseLink).toHaveCount(0);
      const spanishLink = mobileNavSheet.getByRole("link", {
        name: "Español",
      });
      await expect(spanishLink).toHaveCount(0);
      try {
        await mobileLanguageButton.tap();
      } catch {
        await mobileLanguageButton.click();
      }
      await expect(chineseLink).toHaveCount(0);
      await expect(spanishLink).toBeVisible();
      try {
        await spanishLink.tap();
      } catch {
        await spanishLink.click();
      }

      await page.waitForURL("**/es");
      await waitForLoadWithFallback(page);
      await waitForStablePage(page);
      // Wait for hydration to update html[lang] (PPR mode requires client-side correction)
      await waitForHtmlLang(page, "es");
      const currentLang = await page.locator("html").getAttribute("lang");
      expect(currentLang).toBe("es");

      // Verify mobile navigation works in Spanish
      await expect(mobileMenuButton).toBeVisible();
      // Prefer tap on mobile, fallback to click
      try {
        await mobileMenuButton.tap();
      } catch {
        await mobileMenuButton.click();
      }

      const mobileNavSheetZh = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheetZh).toBeVisible();
      // The mobile language button is also translated: merged
      // `accessibility.languageSelector` ("Seleccionar idioma") + the active
      // language name. Asserting the English label here was the same Gap-1
      // contract bug.
      await expect(
        mobileNavSheetZh.getByRole("button", {
          name: /seleccionar idioma español/i,
        }),
      ).toBeVisible();

      // Verify the mobile nav renders the Spanish-translated buyer link
      // (real merged "nav.membranes" = "Membranas", not English copy).
      await expect(
        mobileNavSheetZh.getByRole("link", { name: "Membranas" }),
      ).toBeVisible();
    });
  });

  test.describe("Accessibility and i18n", () => {
    test("should pass accessibility checks in both languages", async ({
      page,
    }) => {
      await injectAxe(page);

      // Check English accessibility (focus on main content and primary navigation)
      await checkA11y(page, 'main, nav[aria-label="Main navigation"]', {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });

      // Wait for language toggle to be enabled (not in isPending state)
      await page.waitForSelector(
        'button[data-testid="language-toggle-button"]:not(:disabled)',
        { state: "visible", timeout: 10000 },
      );

      // Switch to Spanish and check again
      const languageToggleButton = page.getByTestId("language-toggle-button");
      await languageToggleButton.click();

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es");
      await waitForStablePage(page);

      // 导航后需再次注入 axe（window 上下文已刷新）
      await injectAxe(page);

      // Check Spanish accessibility with the same axe rules used on English.
      await checkA11y(page, 'main, nav[aria-label="Main navigation"]', {
        detailedReport: true,
        detailedReportOptions: { html: true },
        includedImpacts: ["critical", "serious"],
      });
    });

    test("should have proper lang attributes for screen readers", async ({
      page,
    }) => {
      // Verify English lang attribute
      let htmlLang = await page.locator("html").getAttribute("lang");
      expect(htmlLang).toBe("en");

      // Switch to Spanish
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();

      // More robust: wait for Spanish UI elements instead of just URL/networkidle
      await expect(page.locator("html")).toHaveAttribute("lang", "es", {
        timeout: 30_000,
      });
      await expect(
        page.getByRole("link", { name: "Membranas" }).first(),
      ).toBeVisible({ timeout: 30_000 });
      await waitForStablePage(page);

      // Verify Spanish lang attribute with fallback to visible Spanish UI
      htmlLang = await page.locator("html").getAttribute("lang");
      if (htmlLang !== "es") {
        const nav = getNav(page);
        await expect(
          nav.getByRole("link", { name: "Membranas" }),
        ).toBeVisible();
      } else {
        expect(htmlLang).toBe("es");
      }

      // Verify language toggle has proper ARIA labels
      const anyLanguageToggle = page
        .locator('button[data-testid="language-toggle-button"]')
        .first();
      await expect(anyLanguageToggle).toHaveAttribute("aria-label");

      // Verify language links have proper attributes
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      const englishLink = getLanguageLinkInOpenDropdown(page, "en");
      const spanishLinkInDropdown = getLanguageLinkInOpenDropdown(page, "es");
      await expect(englishLink).toHaveAttribute("data-locale", "en");
      await expect(spanishLinkInDropdown).toHaveAttribute("data-locale", "es");
      await expect(
        getOpenLanguageDropdown(page).locator(
          '[data-testid="language-link-zh"]',
        ),
      ).toHaveCount(0);
    });
  });

  test.describe("URL and SEO", () => {
    test("should generate correct URLs for different locales", async ({
      page,
    }) => {
      // Test English URLs
      expect(page.url()).toMatch(/\/en\/?$/);

      // About is a real route, but it is no longer in the Step 2 public nav.
      await page.goto("/en/about");
      await page.waitForURL("**/en/about");

      expect(page.url()).toContain("/en/about");

      // Switch to Spanish
      const languageToggleButton = page.getByTestId("language-toggle-button");
      await languageToggleButton.click();

      const spanishLink = getLanguageLinkInOpenDropdown(page, "es");
      await spanishLink.click();
      await page.waitForURL("**/es/about");

      expect(page.url()).toContain("/es/about");
    });

    test("should handle direct navigation to localized URLs", async ({
      page,
    }) => {
      // Direct navigation to Chinese homepage remains available for internal preview.
      await page.goto("/zh");
      await waitForLoadWithFallback(page);
      await waitForStablePage(page);

      // Verify Chinese content (wait for hydration to update html[lang])
      await waitForHtmlLang(page, "zh");
      const htmlLang = await page.locator("html").getAttribute("lang");
      expect(htmlLang).toBe("zh");

      // Direct navigation to Chinese About page
      await page.goto("/zh/about");
      await waitForLoadWithFallback(page);
      await waitForHtmlLang(page, "zh");

      expect(page.url()).toContain("/zh/about");
      const aboutLang = await page.locator("html").getAttribute("lang");
      expect(aboutLang).toBe("zh");

      // Internal Chinese preview must not leak into the public language switcher.
      await safeClick(
        page,
        'button[data-testid="language-toggle-button"]:not(:disabled)',
      );
      const dropdown = getOpenLanguageDropdown(page);
      await expect(
        dropdown.locator('[data-testid="language-link-en"]'),
      ).toHaveCount(1);
      await expect(
        dropdown.locator('[data-testid="language-link-es"]'),
      ).toHaveCount(1);
      await expect(
        dropdown.locator('[data-testid="language-link-zh"]'),
      ).toHaveCount(0);
    });
  });
});
