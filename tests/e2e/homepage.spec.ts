import { expect, test, type Page } from "@playwright/test";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

/**
 * Homepage buyer contract (BC-001).
 *
 * The homepage is a part-number problem solver, not a generic brand page.
 * The buyer-facing promise is:
 *   1. The brand H1 and compatibility sub-claim render.
 *   2. The hero compatibility search is operable: typing a known OEM part
 *      number surfaces a matching result link into the OEM brand path.
 *   3. The OEM brand grid links each brand to its `/compatible/{slug}` page.
 *   4. The final CTA links to the quote page and to a membranes product page.
 *
 * Locators are user-facing (role / accessible name / text) per
 * `.claude/rules/testing.md`. The deleted `hero-section`/`hero-preview-card`
 * testids are intentionally not referenced — they no longer exist in the DOM.
 */

interface LocaleCase {
  readonly locale: "en" | "es";
  readonly heroTitle: string;
  readonly searchLabel: string;
  readonly oemGridTitle: string;
  readonly firstBrandLink: string;
  readonly slaReview: string;
  readonly finalCtaTitle: string;
  readonly requestQuote: string;
  readonly viewMembranes: string;
}

// Expected strings come from messages/{locale}/critical.json -> "home".
const LOCALE_CASES: readonly LocaleCase[] = [
  {
    locale: "en",
    heroTitle: "Find Your Replacement Membrane",
    searchLabel: "Compatibility search",
    oemGridTitle: "Replacement Membranes for Major Brands",
    firstBrandLink: "View Sanitaire compatible parts",
    // From messages/en/critical.json -> trust.sla.review (shared Phase-A copy
    // rendered through the SlaCommitments ribbon).
    slaReview: "Compatibility review — within 24 business hours.",
    finalCtaTitle: "Have a part number ready?",
    requestQuote: "Request a Quote",
    viewMembranes: "Browse All Membranes",
  },
  {
    locale: "es",
    heroTitle: "Encuentre su membrana de repuesto",
    searchLabel: "Búsqueda de compatibilidad",
    oemGridTitle: "Membranas de repuesto para las principales marcas",
    firstBrandLink: "Ver piezas compatibles con Sanitaire",
    // From messages/es/critical.json -> trust.sla.review.
    slaReview: "Revisión de compatibilidad: en un plazo de 24 horas hábiles.",
    finalCtaTitle: "¿Tiene un número de pieza a mano?",
    requestQuote: "Solicitar una cotización",
    viewMembranes: "Ver todas las membranas",
  },
];

// "00223" is the Sanitaire "Silver Series II 9 inch Disc" OEM part number.
// Confirmed in src/data/product-compatibility/catalog.ts and exercised by
// src/components/search/__tests__/compatibility-search.test.tsx.
const KNOWN_PART_NUMBER = "00223";
const KNOWN_MODEL_NAME = /Silver Series II 9 inch Disc/i;
const FIRST_BRAND_SLUG = "sanitaire";
// Canonical descriptive membrane slug (the SKU slug `tuc-d9-epdm`
// 308-redirects to this). The final CTA links straight to the canonical URL.
const MEMBRANES_HREF_FRAGMENT = "/membranes/9-inch-epdm-disc-replacement";

async function gotoHomepage(page: Page, locale: string): Promise<void> {
  await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(`**/${locale}`);
  await waitForLoadWithFallback(page, {
    context: `homepage (${locale})`,
    loadTimeout: 5_000,
    fallbackDelay: 500,
  });
  await removeInterferingElements(page);
  await waitForStablePage(page);
}

for (const localeCase of LOCALE_CASES) {
  test.describe(`Homepage buyer contract (${localeCase.locale})`, () => {
    const consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
      consoleErrors.length = 0;
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        consoleErrors.push(error.message);
      });
      await gotoHomepage(page, localeCase.locale);
    });

    test.afterEach(() => {
      // Critical-smoke discipline: a broken render must fail this spec.
      expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
    });

    test("loads at the locale root with the brand H1 and sub-claim", async ({
      page,
    }) => {
      await expect(page).toHaveTitle(/Tucsenberg/);

      const heading = page.getByRole("heading", {
        level: 1,
        name: localeCase.heroTitle,
      });
      await expect(heading).toBeVisible();
    });

    test("hero compatibility search surfaces a matching result", async ({
      page,
    }) => {
      const search = page.getByRole("combobox", {
        name: localeCase.searchLabel,
      });
      await expect(search).toBeVisible();
      await expect(search).toHaveAttribute("aria-expanded", "false");

      await search.fill(KNOWN_PART_NUMBER);

      await expect(search).toHaveAttribute("aria-expanded", "true");

      const resultsListbox = page.getByRole("listbox", {
        name: localeCase.searchLabel,
      });
      await expect(resultsListbox).toBeVisible();

      const modelLink = resultsListbox.getByRole("link", {
        name: KNOWN_MODEL_NAME,
      });
      await expect(modelLink).toBeVisible();
      await expect(modelLink).toHaveAttribute(
        "href",
        `/${localeCase.locale}/compatible/${FIRST_BRAND_SLUG}`,
      );
    });

    test("OEM brand grid links a brand to its compatibility page", async ({
      page,
    }) => {
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: localeCase.oemGridTitle,
        }),
      ).toBeVisible();

      // The brand card link's accessible name combines the brand name and the
      // "view all" call to action; the default (substring) name match resolves
      // it via the CTA text.
      const brandLink = page
        .getByRole("link", { name: localeCase.firstBrandLink })
        .first();
      await expect(brandLink).toBeVisible();
      await expect(brandLink).toHaveAttribute(
        "href",
        `/${localeCase.locale}/compatible/${FIRST_BRAND_SLUG}`,
      );

      await brandLink.click();
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/${localeCase.locale}/compatible/${FIRST_BRAND_SLUG}`);
    });

    test("renders the shared SLA commitments ribbon", async ({ page }) => {
      const ribbon = page.getByTestId("sla-commitments");
      await expect(ribbon).toBeVisible();
      await expect(ribbon).toHaveAttribute("data-layout", "ribbon");
      await expect(
        ribbon.getByText(localeCase.slaReview, { exact: false }),
      ).toBeVisible();
    });

    test("final CTA links to the quote page and a membranes product page", async ({
      page,
    }) => {
      // The global header's primary CTA legitimately also reads "Request a
      // Quote" and points at /quote, so a page-wide link lookup is ambiguous
      // under Playwright strict mode. Scope to the in-page final-CTA section
      // via its unique heading (the header is a separate `banner` landmark
      // with no `cta.title` heading), so this still proves the IN-PAGE final
      // CTA and would fail if that section's links regressed.
      const finalCtaSection = page.locator("section", {
        has: page.getByRole("heading", {
          level: 2,
          name: localeCase.finalCtaTitle,
        }),
      });
      await expect(finalCtaSection).toBeVisible();

      const quoteLink = finalCtaSection.getByRole("link", {
        name: localeCase.requestQuote,
      });
      await expect(quoteLink).toBeVisible();
      await expect(quoteLink).toHaveAttribute(
        "href",
        `/${localeCase.locale}/quote`,
      );

      const membranesLink = finalCtaSection.getByRole("link", {
        name: localeCase.viewMembranes,
      });
      await expect(membranesLink).toBeVisible();
      await expect(membranesLink).toHaveAttribute(
        "href",
        `/${localeCase.locale}${MEMBRANES_HREF_FRAGMENT}`,
      );
    });
  });
}
