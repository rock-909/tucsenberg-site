const HOME_PAGE = "src/app/[locale]/page.tsx";
const PRODUCTS_OVERVIEW =
  "src/app/[locale]/products/products-overview-sections.tsx";
const CONTACT_FEEDBACK = "src/components/forms/contact-form-feedback.tsx";
const STRUCTURED_DATA = "src/lib/structured-data-generators.ts";

function parameterOverrides(file, functionNames, identifier, namespace) {
  return functionNames.map((functionName) => ({
    file,
    functionName,
    identifier,
    namespace,
    reason: `${functionName} receives the ${namespace || "root"} translator`,
  }));
}

const TRANSLATOR_PARAMETER_OVERRIDES = [
  ...parameterOverrides(
    HOME_PAGE,
    [
      "getHomePageContent",
      "HomeHowToChooseSection",
      "HomeStartPathSection",
      "HomeVerifySection",
      "HomeFinalAction",
    ],
    "t",
    "home",
  ),
  ...parameterOverrides(
    PRODUCTS_OVERVIEW,
    ["ProductLineCards", "ProductOverviewPath", "ProductLaunchBoundary"],
    "translate",
    "catalog",
  ),
  ...parameterOverrides(
    "src/app/[locale]/request-quote/page.tsx",
    ["RequestQuoteAside"],
    "t",
    "requestQuote.page",
  ),
  ...parameterOverrides(
    "src/app/[locale]/request-quote/request-quote-form-copy.ts",
    ["createRequestQuoteFormCopy"],
    "t",
    "requestQuote.form",
  ),
  ...parameterOverrides(
    "src/app/[locale]/request-quote/request-quote-payload.ts",
    ["createRequestQuotePayloadCopy"],
    "t",
    "requestQuote.form",
  ),
  ...parameterOverrides(
    "src/components/forms/inquiry-form-copy.ts",
    ["createInquiryFormCopy"],
    "t",
    "inquiry.form",
  ),
  ...parameterOverrides(
    "src/components/cookie/cookie-banner.tsx",
    ["MainBanner", "PreferencesPanel"],
    "t",
    "cookie",
  ),
  ...parameterOverrides(
    "src/components/forms/contact-form-container-view.tsx",
    ["ContactFormContainerView"],
    "translateForm",
    "contact.form",
  ),
  ...parameterOverrides(
    CONTACT_FEEDBACK,
    ["getStatusConfig", "StatusMessage"],
    "t",
    "contact.form",
  ),
  ...parameterOverrides(
    CONTACT_FEEDBACK,
    ["getErrorDisplayState", "ErrorDisplay"],
    "translateForm",
    "contact.form",
  ),
  ...parameterOverrides(
    "src/components/forms/contact-form-fields.tsx",
    ["getFieldPlaceholder", "FormFields"],
    "t",
    "contact.form",
  ),
  ...parameterOverrides(
    "src/components/sections/hero-section.tsx",
    ["buildHeroProofItem"],
    "t",
    "home",
  ),
  ...parameterOverrides(
    STRUCTURED_DATA,
    [
      "getSocialProfileUrls",
      "generateOrganizationData",
      "generateWebSiteData",
      "generateArticleData",
    ],
    "t",
    "structured-data",
  ),
];

const DYNAMIC_MESSAGE_KEY_PREFIXES = [
  [
    "home.problems.items.",
    "homepage problem cards are keyed by approved config arrays",
  ],
  [
    "home.answer.items.",
    "homepage answer cards are keyed by approved config arrays",
  ],
  [
    "home.startPath.items.",
    "homepage paths are keyed by approved config arrays",
  ],
  [
    "home.howToChoose.rows.",
    "comparison rows are keyed by approved config arrays",
  ],
  [
    "home.verify.items.",
    "verification cards are keyed by approved config arrays",
  ],
  ["home.faq.items.", "homepage FAQ items are keyed by approved config arrays"],
  [
    "contact.inquiryHandoff.items.",
    "contact handoff cards are keyed by the fixed need/context/timing tuple",
  ],
  ["catalog.markets.", "catalog product cards are keyed by product slugs"],
  ["catalog.path.items.", "catalog path cards are keyed by config"],
  ["catalog.detail.items.", "catalog detail items are keyed by config"],
  ["catalog.boundary.items.", "catalog boundary items are keyed by config"],
  [
    "contact.form.",
    "contact field descriptors and API results provide typed keys",
  ],
  ["navigation.", "navigation config provides the dynamic mobile link keys"],
  ["theme.", "theme options store their label keys"],
].map(([prefix, reason]) => ({ prefix, reason }));

const MESSAGE_OBJECT_KEY_CONSUMERS = [
  {
    file: "src/lib/contact/getContactCopy.ts",
    objectName: "CONTACT_COPY_FALLBACKS",
    prefix: "contact.",
    reason:
      "the contact copy model reads every fallback object key from contact messages",
  },
];

const MESSAGE_DERIVED_KEY_CONSUMERS = [
  {
    kind: "collection-values",
    file: "src/config/pages.config.ts",
    sourceName: "PUBLIC_STATIC_PAGE_DEFINITIONS",
    valueProperty: "navigationKey",
    prefix: "",
    suffixes: [""],
    reason: "main navigation consumes the active page definition keys",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site.ts",
    sourceName: "FOOTER_TRANSLATION_KEYS",
    prefix: "",
    suffixes: [""],
    reason: "footer links consume the configured translation key values",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site.ts",
    sourceName: "FOOTER_COLUMN_TRANSLATION_KEYS",
    prefix: "",
    suffixes: [""],
    reason: "footer column headings consume their literal translation keys",
  },
  {
    kind: "call-arguments",
    file: "src/components/footer/Footer.tsx",
    ownerFunction: "Footer",
    callee: "translateWithFallback",
    prefixes: [""],
    reason: "footer local fallback calls consume their literal message keys",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS",
    prefix: "home.problems.items.",
    suffixes: [".title", ".description", ".linkLabel"],
    reason: "homepage problem cards derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS",
    prefix: "home.answer.items.",
    suffixes: [".title", ".description"],
    reason: "homepage answer cards derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS",
    prefix: "home.startPath.items.",
    suffixes: [".title", ".description"],
    reason: "homepage start paths derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_HOW_TO_CHOOSE_ROW_KEYS",
    prefix: "home.howToChoose.rows.",
    suffixes: [".situation", ".startWith"],
    reason: "comparison rows derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_VERIFY_ITEM_KEYS",
    prefix: "home.verify.items.",
    suffixes: [".title", ".description"],
    reason: "verification cards derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-page-expression.ts",
    sourceName: "SINGLE_SITE_HOME_FAQ_ITEM_KEYS",
    prefix: "home.faq.items.",
    suffixes: [".question", ".answer"],
    reason: "homepage FAQ entries derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/app/[locale]/contact/contact-page-sections.tsx",
    sourceName: "CONTACT_HANDOFF_ITEM_KEYS",
    prefix: "contact.inquiryHandoff.items.",
    suffixes: [".title", ".description"],
    reason: "contact handoff cards derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/app/[locale]/products/products-overview-sections.tsx",
    sourceName: "PRODUCT_OVERVIEW_PATH_KEYS",
    prefix: "catalog.path.items.",
    suffixes: [".title", ".description"],
    reason: "catalog path cards derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/app/[locale]/products/products-overview-sections.tsx",
    sourceName: "PRODUCT_DETAIL_UPGRADE_KEYS",
    prefix: "catalog.detail.items.",
    suffixes: [""],
    reason: "catalog detail items derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/app/[locale]/products/products-overview-sections.tsx",
    sourceName: "PRODUCT_BOUNDARY_KEYS",
    prefix: "catalog.boundary.items.",
    suffixes: [""],
    reason: "catalog boundary items derive their exact keys from this tuple",
  },
  {
    kind: "collection-values",
    file: "src/config/single-site-product-catalog.ts",
    sourceName: "productLines",
    valueProperty: "slug",
    prefix: "catalog.markets.",
    suffixes: [".label", ".description"],
    reason: "catalog market cards derive their exact keys from product slugs",
  },
  {
    kind: "collection-values",
    file: "src/components/ui/theme-switcher.tsx",
    sourceName: "themes",
    valueProperty: "labelKey",
    prefix: "theme.",
    suffixes: [""],
    reason: "the theme switcher translates only its three configured labels",
  },
  {
    kind: "collection-values",
    file: "src/config/contact-form-config.ts",
    sourceName: "DEFAULT_FIELD_CONFIGS",
    valueProperty: "i18nKey",
    entryFilters: [
      { property: "enabled", equals: true },
      { property: "type", notEquals: "hidden" },
    ],
    prefix: "contact.form.",
    suffixes: [""],
    reason: "visible contact field labels derive from the form configuration",
  },
  {
    kind: "collection-values",
    file: "src/config/contact-form-config.ts",
    sourceName: "PLACEHOLDER_KEYS",
    entryKeySource: {
      sourceName: "DEFAULT_FIELD_CONFIGS",
      filters: [
        { property: "enabled", equals: true },
        { property: "type", notEquals: "hidden" },
      ],
    },
    prefix: "contact.form.",
    suffixes: [""],
    reason: "contact field placeholders derive from the placeholder map",
  },
  {
    kind: "collection-values",
    file: "src/components/forms/contact-form-container-view.tsx",
    sourceName: "TURNSTILE_STATUS_MESSAGE_KEYS",
    prefix: "contact.form.",
    suffixes: [""],
    reason: "Turnstile states translate the exact configured status labels",
  },
  {
    kind: "collection-values",
    file: "src/components/forms/contact-form-feedback.tsx",
    sourceName: "CONTACT_FORM_API_ERROR_CODES",
    prefix: "apiErrors.",
    suffixes: [""],
    reason:
      "the contact client enforces these literal runtime response-code values",
  },
  {
    kind: "collection-values",
    file: "src/constants/api-error-codes.ts",
    sourceName: "API_ERROR_CODES",
    prefix: "apiErrors.",
    suffixes: [""],
    reason:
      "every stable API error code must keep a localized apiErrors message leaf",
  },
  {
    kind: "collection-values",
    file: "src/lib/contact/submit-canonical-contact.ts",
    sourceName: "CONTACT_FORM_VALIDATION_DETAIL_KEYS",
    prefix: "contact.form.",
    suffixes: [""],
    reason: "the contact validator enforces this finite detail-key domain",
  },
  {
    kind: "collection-values",
    file: "src/lib/api/inquiry-validation-details.ts",
    sourceName: "PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS",
    prefix: "contact.form.",
    suffixes: [""],
    reason:
      "inquiry validation emits these contact.form detail keys to the client",
  },
  {
    kind: "call-arguments",
    file: "src/components/errors/route-error-view.tsx",
    ownerFunction: "RouteErrorView",
    callee: "translationFn",
    prefixes: ["errors.contact.", "errors.products."],
    reason: "both route boundaries pass their namespace into the shared view",
  },
  {
    kind: "property-accesses",
    file: "src/emails/email-copy.ts",
    rootName: "emailTemplateCopy",
    prefix: "emailTemplates.",
    reason: "email copy consumes only the properties reached from this object",
  },
];

// Keep empty unless a zero-consumer key is intentionally retained with reason.
const UNUSED_MESSAGE_KEYS = [];

module.exports = {
  DYNAMIC_MESSAGE_KEY_PREFIXES,
  MESSAGE_DERIVED_KEY_CONSUMERS,
  MESSAGE_OBJECT_KEY_CONSUMERS,
  TRANSLATOR_PARAMETER_OVERRIDES,
  UNUSED_MESSAGE_KEYS,
};
