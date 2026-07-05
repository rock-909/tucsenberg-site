function ensureTypeScriptRequireRuntime() {
  if (require.extensions[".ts"]) return;
  if (process.env.VITEST === "true" || process.env.VITEST_WORKER_ID) return;
  require("tsx/cjs");
}

function isVitestRuntime() {
  return process.env.VITEST === "true" || Boolean(process.env.VITEST_WORKER_ID);
}

function loadContactFormConfigModule() {
  if (isVitestRuntime()) {
    return {
      CONTACT_FORM_CONFIG: {
        features: {
          enableTurnstile: true,
        },
      },
    };
  }

  ensureTypeScriptRequireRuntime();
  return require("../../../src/config/contact-form-config");
}

function loadPublicTrustModule() {
  if (isVitestRuntime()) {
    const fakePhonePattern =
      /(?:\+?1[\s.-]?)?(?:(?:\(?555\)?[\s.-]?\d{3})|(?:\(?\d{3}\)?[\s.-]?555))[\s.-]?\d{4}\b|\b123[\s.-]?456[\s.-]?7890\b/iu;
    return {
      getPublicContactEmail: (email) =>
        email &&
        !/@(?:example\.com|example\.org|example\.net|[\w.-]+\.example)$/iu.test(
          email.trim(),
        )
          ? email.trim()
          : undefined,
      getPublicContactPhone: (phone) =>
        phone &&
        !/(?:^|[-\s])0{3,}(?:[-\s]|$)/u.test(phone) &&
        !fakePhonePattern.test(phone)
          ? phone.trim()
          : undefined,
      getPublicLogoPath: (logo) =>
        logo?.status === "ready" ? logo.horizontal : undefined,
    };
  }

  ensureTypeScriptRequireRuntime();
  return require("../../../src/config/public-trust");
}

function loadSingleSiteModule() {
  if (isVitestRuntime()) {
    const config = {
      baseUrl: "https://example.com",
      name: "Showcase Website Starter",
      description:
        "Public demo starter for launching a showcase website foundation",
      seo: {
        titleTemplate: "%s | Showcase Website Starter",
        defaultTitle: "Showcase Website Starter - Public Demo Starter Site",
        defaultDescription:
          "A public demo starter site for teams that need a deployable showcase website foundation before they have a real website.",
      },
      social: {
        twitter: "https://x.com/example",
        linkedin: "https://www.linkedin.com/company/example",
      },
      contact: {
        phone: "+86-518-0000-0000",
        email: "starter-contact@example.com",
      },
    };

    return {
      SINGLE_SITE_DEFINITION: { config },
      SINGLE_SITE_FACTS: {
        company: {
          name: "Showcase Website Starter",
          location: {
            city: "Replace before launch",
            address: "Replace before launch",
          },
        },
        contact: config.contact,
        brandAssets: {
          logo: {
            status: "pending",
          },
          productPhotos: {
            status: "pending",
          },
        },
      },
    };
  }

  ensureTypeScriptRequireRuntime();
  return require("../../../src/config/single-site");
}

function loadSiteConfigValidatorModule() {
  if (isVitestRuntime()) {
    return {
      validateSiteConfig: () => ({
        valid: true,
        warnings: [],
        errors: [],
      }),
    };
  }

  ensureTypeScriptRequireRuntime();
  return require("../../../src/config/paths/site-config");
}

const MIN_SECRET_LENGTH = 32;

function readEnv(env, key) {
  const value = env[key];
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasPair(env, firstKey, secondKey) {
  return Boolean(readEnv(env, firstKey) && readEnv(env, secondKey));
}

function hasAny(env, ...keys) {
  return keys.some((key) => Boolean(readEnv(env, key)));
}

function isTrue(env, key) {
  return readEnv(env, key) === "true";
}

function containsStarterMarker(value) {
  if (!value) return true;

  return /Example Showcase Company|Showcase Website Starter|example\.(?:com|org|net)|[\w.-]+\.example|localhost|127\.0\.0\.1|sales@example\.com|starter-contact@example\.com|showcase website example|showcase website starter|public demo starter|replaceable showcase website example|Public Demo Starter Site|Example Business Park|Example City|Replace before launch|x\.com\/example|linkedin\.com\/company\/example/iu.test(
    value,
  );
}

function validateNoStarterMarker(target, markerPath, value, reason) {
  if (containsStarterMarker(value)) {
    target.push(`${markerPath} is not public-launch ready (${reason}).`);
  }
}

function validateLaunchSignoff(target, env, key, surface, reason) {
  if (!isTrue(env, key)) {
    target.push(
      `${key} must be true after owner review of ${surface} (${reason}).`,
    );
  }
}

function validateRequiredEnv(target, env, key, reason) {
  if (!readEnv(env, key)) {
    target.push(`${key} is required (${reason}).`);
  }
}

function validateMinLengthEnv(target, env, key, minLength, reason) {
  const value = readEnv(env, key);
  if (!value) {
    target.push(`${key} is required (${reason}).`);
  } else if (value.length < minLength) {
    target.push(
      `${key} must be at least ${minLength} characters long (${reason}). Current length: ${value.length}`,
    );
  }
}

function shouldValidateProductionRuntimeContract(env) {
  if (isTrue(env, "PUBLIC_LAUNCH_STRICT")) {
    return true;
  }

  const appEnv = readEnv(env, "APP_ENV")?.toLowerCase();

  if (appEnv === "preview") {
    return false;
  }

  if (appEnv === "production") {
    return true;
  }

  const nodeEnv = readEnv(env, "NODE_ENV")?.toLowerCase();
  const isProduction = nodeEnv === "production";
  const isCloudflareProduction =
    isProduction &&
    hasAny(env, "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN");

  return isProduction || isCloudflareProduction;
}

function validateProductionRuntimeContract(env) {
  const warnings = [];
  const errors = [];
  const { CONTACT_FORM_CONFIG } = loadContactFormConfigModule();
  const hasUpstash = hasPair(
    env,
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  );
  const hasKv = hasPair(env, "KV_REST_API_URL", "KV_REST_API_TOKEN");

  if (!hasUpstash && !hasKv) {
    errors.push(
      "Production rate limiting requires Upstash Redis. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  } else if (!hasUpstash && hasKv) {
    errors.push(
      "KV-only rate limiting is not allowed in production. Configure Upstash Redis for the shared security stores or remove the KV-only setup.",
    );
  }

  validateMinLengthEnv(
    errors,
    env,
    "RATE_LIMIT_PEPPER",
    MIN_SECRET_LENGTH,
    "production rate-limit keys rely on it and runtime already throws when it is missing or weak",
  );
  validateMinLengthEnv(
    errors,
    env,
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
    MIN_SECRET_LENGTH,
    "Server Actions deployment requires a stable encryption key",
  );

  if (CONTACT_FORM_CONFIG.features.enableTurnstile) {
    validateRequiredEnv(
      errors,
      env,
      "TURNSTILE_SECRET_KEY",
      "Contact form verification depends on server-side Turnstile validation",
    );
    validateRequiredEnv(
      errors,
      env,
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "the live Contact form widget depends on a public Turnstile site key",
    );
  }

  validateRequiredEnv(
    errors,
    env,
    "RESEND_API_KEY",
    "the shipped lead pipeline sends admin notification email through Resend",
  );
  validateRequiredEnv(
    errors,
    env,
    "AIRTABLE_API_KEY",
    "the shipped lead pipeline persists lead records in Airtable",
  );
  validateRequiredEnv(
    errors,
    env,
    "AIRTABLE_BASE_ID",
    "the shipped lead pipeline persists lead records in Airtable",
  );

  if (isTrue(env, "ALLOW_MEMORY_RATE_LIMIT")) {
    errors.push(
      "Degraded in-memory rate-limit store flag (ALLOW_MEMORY_RATE_LIMIT) cannot be used in production. Configure a durable Redis-compatible store for production deployments.",
    );
  }

  return { warnings, errors };
}

function validatePublicLaunchTrustContent(env) {
  const warnings = [];
  const errors = [];
  const { getPublicContactEmail, getPublicContactPhone, getPublicLogoPath } =
    loadPublicTrustModule();
  const { SINGLE_SITE_DEFINITION, SINGLE_SITE_FACTS } = loadSingleSiteModule();
  const target = isTrue(env, "PUBLIC_LAUNCH_STRICT") ? errors : warnings;
  const shouldCheck =
    isTrue(env, "PUBLIC_LAUNCH_STRICT") ||
    isTrue(env, "VALIDATE_PUBLIC_LAUNCH_CONTENT");

  if (!shouldCheck) {
    return { warnings, errors };
  }

  validateNoStarterMarker(
    target,
    "SITE_CONFIG.name",
    SINGLE_SITE_DEFINITION.config.name,
    "replace the starter company identity before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.baseUrl",
    SINGLE_SITE_DEFINITION.config.baseUrl,
    "configure the real public domain before client launch",
  );
  if (
    containsStarterMarker(SINGLE_SITE_DEFINITION.config.contact.email) ||
    !getPublicContactEmail(SINGLE_SITE_DEFINITION.config.contact.email)
  ) {
    target.push(
      "SITE_CONFIG.contact.email is not public-launch ready (replace the starter contact email before client launch).",
    );
  }
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.defaultTitle",
    SINGLE_SITE_DEFINITION.config.seo.defaultTitle,
    "replace starter SEO title defaults before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.defaultDescription",
    SINGLE_SITE_DEFINITION.config.seo.defaultDescription,
    "replace starter SEO description defaults before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.social.twitter",
    SINGLE_SITE_DEFINITION.config.social.twitter,
    "replace the starter social profile before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.social.linkedin",
    SINGLE_SITE_DEFINITION.config.social.linkedin,
    "replace the starter social profile before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.seo.titleTemplate",
    SINGLE_SITE_DEFINITION.config.seo.titleTemplate,
    "replace the starter SEO title template before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.description",
    SINGLE_SITE_DEFINITION.config.description,
    "replace the starter company description before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.facts.company.name",
    SINGLE_SITE_FACTS.company.name,
    "replace the starter legal/company name before client launch",
  );
  validateNoStarterMarker(
    target,
    "SITE_CONFIG.facts.company.location",
    `${SINGLE_SITE_FACTS.company.location.city} ${SINGLE_SITE_FACTS.company.location.address ?? ""}`,
    "replace starter city/address before client launch",
  );
  validateLaunchSignoff(
    target,
    env,
    "PUBLIC_LAUNCH_LEGAL_CONTENT_REVIEWED",
    "content/pages/{locale}/{about,contact,privacy,terms}.mdx",
    "confirm legal/contact page truth before client launch",
  );
  if (!getPublicContactPhone(SINGLE_SITE_FACTS.contact.phone)) {
    target.push(
      "SITE_CONFIG.contact.phone is not public-launch ready. Hide it from runtime now and replace it with the owner-confirmed public phone before launch.",
    );
  }

  if (!getPublicLogoPath(SINGLE_SITE_FACTS.brandAssets.logo)) {
    target.push(
      "brandAssets.logo.status is pending. Header falls back to text-only now; owner-confirmed logo files must be supplied before launch.",
    );
  }

  if (SINGLE_SITE_FACTS.brandAssets.productPhotos.status !== "ready") {
    target.push(
      "brandAssets.productPhotos.status is pending. Neutral product illustrations are allowed for preview, but owner-confirmed product photos must be supplied before launch.",
    );
  }

  return { warnings, errors };
}

function validateProductionConfig(env = process.env) {
  const { validateSiteConfig } = loadSiteConfigValidatorModule();
  const siteConfig = validateSiteConfig();
  const runtimeContractChecked = shouldValidateProductionRuntimeContract(env);
  const runtimeContract = runtimeContractChecked
    ? validateProductionRuntimeContract(env)
    : { warnings: [], errors: [] };
  const publicLaunchTrust = validatePublicLaunchTrustContent(env);

  return {
    warnings: [
      ...siteConfig.warnings,
      ...runtimeContract.warnings,
      ...publicLaunchTrust.warnings,
    ],
    errors: [
      ...siteConfig.errors,
      ...runtimeContract.errors,
      ...publicLaunchTrust.errors,
    ],
    runtimeContractChecked,
  };
}

function runValidateProductionConfigCli() {
  const report = validateProductionConfig(process.env);

  if (report.warnings.length > 0) {
    console.warn("Warnings:");
    for (const warning of report.warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    console.error("Errors:");
    for (const error of report.errors) {
      console.error(`  - ${error}`);
    }
    return false;
  }

  console.log("Production configuration validated successfully.");
  if (report.runtimeContractChecked) {
    console.log("Runtime contract enforced.");
  }
  return true;
}

module.exports = {
  runValidateProductionConfigCli,
  shouldValidateProductionRuntimeContract,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
};
