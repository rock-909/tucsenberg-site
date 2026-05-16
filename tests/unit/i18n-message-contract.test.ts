import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import esCriticalMessages from "../../messages/es/critical.json";
import esDeferredMessages from "../../messages/es/deferred.json";
import zhCriticalMessages from "../../messages/zh/critical.json";
import zhDeferredMessages from "../../messages/zh/deferred.json";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

const REQUIRED_RUNTIME_KEYS = [
  "accessibility.securityVerificationUnavailable",
  "accessibility.turnstileDevBypass",
  "accessibility.turnstileTestMode",
  "accessibility.turnstileLoadFailed",
  "contact.form.networkError",
] as const;

const INQUIRY_API_VALIDATION_DETAIL_KEYS = [
  "errors.fullName.required",
  "errors.fullName.invalid",
  "errors.fullName.tooLong",
  "errors.fullName.tooShort",
  "errors.email.required",
  "errors.email.invalid",
  "errors.email.tooLong",
  "errors.company.tooShort",
  "errors.company.tooLong",
  "errors.company.invalid",
  "errors.productSlug.required",
  "errors.productSlug.invalid",
  "errors.productName.required",
  "errors.productName.invalid",
  "errors.productName.tooLong",
  "errors.productName.tooShort",
  "errors.quantity.required",
  "errors.quantity.invalid",
  "errors.requirements.invalid",
  "errors.requirements.tooLong",
] as const;

const CONTACT_API_VALIDATION_DETAIL_KEYS = [
  "errors.message.required",
  "errors.message.tooShort",
  "errors.message.tooLong",
  "errors.subject.length",
  "errors.acceptPrivacy.required",
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(critical: JsonObject, deferred: JsonObject): JsonObject {
  const result: JsonObject = { ...critical };

  for (const [key, value] of Object.entries(deferred)) {
    const existingValue = result[key];
    result[key] =
      isJsonObject(existingValue) && isJsonObject(value)
        ? mergeMessages(existingValue, value)
        : value;
  }

  return result;
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

function collectLeafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectLeafPaths(entry, `${prefix}.${index}`.replace(/^\./u, "")),
    );
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectLeafPaths(child, `${prefix}.${key}`.replace(/^\./u, "")),
  );
}

const LOCALE_MESSAGES = [
  ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
  ["es", mergeMessages(esCriticalMessages, esDeferredMessages)],
  ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
] as const;

describe("real i18n runtime message contract", () => {
  it.each(LOCALE_MESSAGES)(
    "keeps degraded-state form keys in the real %s split message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(LOCALE_MESSAGES)(
    "keeps inquiry API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of INQUIRY_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(LOCALE_MESSAGES)(
    "keeps contact API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of CONTACT_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it("keeps Spanish split message keys structurally aligned with English", () => {
    expect(collectLeafPaths(esCriticalMessages).sort()).toEqual(
      collectLeafPaths(enCriticalMessages).sort(),
    );
    expect(collectLeafPaths(esDeferredMessages).sort()).toEqual(
      collectLeafPaths(enDeferredMessages).sort(),
    );
  });

  // Spanish leaves that are legitimately identical to English (technical
  // material tokens kept in English per content rules, pure ICU passthrough
  // tokens, brand/platform proper nouns, language endonyms, and accepted
  // anglicisms rendered identically in professional Spanish web UI), so an
  // untranslated copy here is intentional and must not require the [ES-TODO]
  // marker. This list curates legitimate-identical leaves only; the assertion
  // logic below is unchanged.
  const ES_IDENTICAL_ALLOWLIST = new Set<string>([
    "home.materials.epdm.name",
    "home.materials.tpu.name",
    "membraneProduct.hero.specBar.material",
    "membraneProduct.hero.specBar.sku",
    "compatibleBrand.filter.material",
    "quote.form.materialOptions.epdm",
    "quote.form.materialOptions.tpu",
    // Pure ICU passthrough tokens (rendered value is fully dynamic).
    "navigation.siteName",
    "footer.copyright",
    // Language switcher endonyms (shown in their own language by convention).
    "language.english",
    "language.chinese",
    // Locale-detection source labels (technical, identical in ES).
    "language.detector.sources.cookie",
    "language.detector.sources.url",
    // Accepted anglicisms used identically in professional Spanish web UI.
    "navigation.blog",
    "navigation.frameworks",
    "footer.sections.navigation.blog",
    "footer.platform.resources.startups",
    // Brand / platform proper nouns (not translated in any locale).
    "footer.sections.social.twitter",
    "footer.sections.social.linkedin",
    "footer.platform.products.fluidCompute",
    "footer.platform.products.nextjs",
    "footer.platform.products.turbo",
    "footer.platform.products.v0",
    "footer.platform.social.linkedin",
    "footer.platform.social.twitter",
    "footer.platform.social.youtube",
  ]);

  it("marks untranslated Spanish copies with ES-TODO", () => {
    const enMessages = mergeMessages(enCriticalMessages, enDeferredMessages);
    const esMessages = mergeMessages(esCriticalMessages, esDeferredMessages);
    const esPaths = collectLeafPaths(esMessages);

    expect(esPaths.length).toBeGreaterThan(0);

    const untranslatedCopies = esPaths.filter((path) => {
      if (ES_IDENTICAL_ALLOWLIST.has(path)) return false;
      const esValue = getMessageValue(esMessages, path);
      const enValue = getMessageValue(enMessages, path);
      if (typeof esValue !== "string" || typeof enValue !== "string") {
        return false;
      }
      // A verbatim English copy that is NOT flagged is a contract violation.
      return esValue === enValue && !esValue.startsWith("[ES-TODO] ");
    });

    expect(untranslatedCopies).toEqual([]);
  });

  it("keeps shallow buyer-visible launch copy aligned to Tucsenberg wording", () => {
    const expectedValues = [
      // Step-4 rebuilt the home surface as a compatibility-search hero.
      // The old starter home keys (home.products.*, home.showcase.*,
      // home.scenarios.*, home.footer.*) were intentionally removed with the
      // old home page during the #6 merge. These pins now assert the real
      // merged Step-4 buyer-visible launch copy instead.
      [enCriticalMessages, "home.hero.title", "Find Your Replacement Membrane"],
      [
        enCriticalMessages,
        "home.hero.subtitle",
        "Enter a part number, OEM model, or diffuser brand to check compatibility.",
      ],
      [
        enCriticalMessages,
        "home.oemGrid.title",
        "Replacement Membranes for Major Brands",
      ],
      [enCriticalMessages, "home.materials.epdm.name", "EPDM"],
      [
        enCriticalMessages,
        "home.materials.tpu.description",
        "Oil, chemical, and high-grease wastewater conditions where EPDM degrades.",
      ],
      [enCriticalMessages, "home.cta.title", "Have a part number ready?"],
      [enCriticalMessages, "home.cta.requestQuote", "Request a Quote"],
      [
        enCriticalMessages,
        "home.trust.scope",
        "Aftermarket replacement membranes only",
      ],
      [
        enCriticalMessages,
        "underConstruction.pages.products.description",
        "Tucsenberg membrane pages are being prepared around OEM-family evidence, material fit, and RFQ-ready inputs.",
      ],
      [
        enCriticalMessages,
        "underConstruction.pages.about.description",
        "Learn how Tucsenberg is preparing a part-number-led replacement membrane site.",
      ],
      [zhCriticalMessages, "home.hero.title", "查找您的替换膜片"],
      [
        zhCriticalMessages,
        "home.hero.subtitle",
        "输入零件号、OEM 型号或曝气器品牌以核对兼容性。",
      ],
      [zhCriticalMessages, "home.oemGrid.title", "面向主流品牌的替换膜片"],
      [zhCriticalMessages, "home.materials.epdm.name", "EPDM"],
      [
        zhCriticalMessages,
        "home.materials.tpu.description",
        "含油、化学品或高油脂废水工况，此类工况下 EPDM 会劣化。",
      ],
      [zhCriticalMessages, "home.cta.title", "已经有零件号了吗？"],
      [zhCriticalMessages, "home.cta.requestQuote", "请求报价"],
      [zhCriticalMessages, "home.trust.scope", "仅提供售后替换膜片"],
      [
        zhCriticalMessages,
        "underConstruction.pages.products.description",
        "Tucsenberg 膜片页面正在围绕 OEM-family 证据、材质适配和 RFQ-ready 输入准备。",
      ],
      [
        zhCriticalMessages,
        "underConstruction.pages.about.description",
        "了解 Tucsenberg 如何准备以 part number 为核心的替换膜片网站。",
      ],
      // The Step-4 home surface ships fully translated Spanish (no [ES-TODO]),
      // so the public es buyer copy must assert the real Spanish wording.
      [
        esCriticalMessages,
        "home.hero.title",
        "Encuentre su membrana de repuesto",
      ],
      [
        esCriticalMessages,
        "home.hero.subtitle",
        "Introduzca un número de pieza, modelo OEM o marca de difusor para verificar la compatibilidad.",
      ],
      [
        esCriticalMessages,
        "home.oemGrid.title",
        "Membranas de repuesto para las principales marcas",
      ],
      [esCriticalMessages, "home.materials.epdm.name", "EPDM"],
      [
        esCriticalMessages,
        "home.materials.tpu.description",
        "Aguas residuales con aceite, productos químicos o alto contenido de grasa donde el EPDM se degrada.",
      ],
      [
        esCriticalMessages,
        "home.cta.title",
        "¿Tiene un número de pieza a mano?",
      ],
      [esCriticalMessages, "home.cta.requestQuote", "Solicitar una cotización"],
      [
        esCriticalMessages,
        "home.trust.scope",
        "Solo membranas de repuesto aftermarket",
      ],
      // underConstruction es copy is still [ES-TODO]-flagged in the merged
      // messages; the parity-aware intent of this test is preserved.
      [
        esCriticalMessages,
        "underConstruction.pages.products.description",
        "[ES-TODO] Tucsenberg membrane pages are being prepared around OEM-family evidence, material fit, and RFQ-ready inputs.",
      ],
      [
        esCriticalMessages,
        "underConstruction.pages.about.description",
        "[ES-TODO] Learn how Tucsenberg is preparing a part-number-led replacement membrane site.",
      ],
    ] as const;

    for (const [messages, keyPath, expectedValue] of expectedValues) {
      expect(getMessageValue(messages, keyPath), keyPath).toBe(expectedValue);
    }
  });
});
