/**
 * Public base-URL readiness for production / public-launch gates.
 * Pure helpers — no runtime env reads.
 *
 * Shared by:
 * - src/config/paths/site-config.ts (via createRequire)
 * - scripts/quality/checks/production-config.js
 */

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isLocalHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isExampleHostname(hostname) {
  return (
    hostname === "example.com" ||
    hostname === "example.org" ||
    hostname === "example.net" ||
    hostname === "example.invalid" ||
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".example.org") ||
    hostname.endsWith(".example.net") ||
    hostname.endsWith(".example.invalid") ||
    hostname.endsWith(".example")
  );
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isWorkersDevHostname(hostname) {
  return hostname === "workers.dev" || hostname.endsWith(".workers.dev");
}

/**
 * @param {string} baseUrl
 * @returns {boolean} true when the URL is acceptable as a public production base URL
 */
function isPublicBaseUrlReady(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    return false;
  }

  let hostname;
  try {
    hostname = new URL(baseUrl).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (isLocalHostname(hostname)) return false;
  if (isExampleHostname(hostname)) return false;
  if (isWorkersDevHostname(hostname)) return false;
  return true;
}

/** Shared fixture list for contract tests (keep TS/JS gates aligned). */
const PUBLIC_BASE_URL_FIXTURES = {
  rejected: [
    "https://tucsenberg-site-production.example.invalid",
    "https://example.com",
    "https://sub.example.org",
    "http://localhost:3000",
    "http://127.0.0.1:8787",
    "https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev",
  ],
  accepted: ["https://tucsenberg.com", "https://www.tucsenberg.com"],
};

module.exports = {
  isPublicBaseUrlReady,
  PUBLIC_BASE_URL_FIXTURES,
};
