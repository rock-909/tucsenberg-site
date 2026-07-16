const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const { locales: CONFIGURED_LOCALES } = require("../../../i18n-locales.config");
const DEFAULT_BUILD_DIR = ".next";

// Contact currently keeps a request-dependent search-param island. D2 removes
// this exemption when the page becomes fully prerendered.
const POSTPONED_ROUTE_EXEMPTIONS = new Map(
  CONFIGURED_LOCALES.map((locale) => [
    `/${locale}/contact`,
    "contact search-param island; remove in M3-D2",
  ]),
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getMetaRelativePath(route) {
  const suffix = route === "/" ? "" : route;
  return path.posix.join("server/app", `${suffix}.meta`);
}

function isPrerenderedMeta(meta) {
  return meta?.headers?.["x-nextjs-prerender"] === "1";
}

function collectMissingManifestFindings(rootDir, requiredPaths) {
  return requiredPaths
    .filter((requiredPath) => !fs.existsSync(requiredPath))
    .map((requiredPath) => ({
      file: path.relative(rootDir, requiredPath),
      error: "missing Next.js build manifest; run pnpm build first",
    }));
}

function collectTemplateFindings(buildRoot, localizedPageTemplates) {
  const findings = [];
  for (const route of localizedPageTemplates) {
    const metaRelativePath = getMetaRelativePath(route);
    const metaPath = path.join(buildRoot, metaRelativePath);
    if (!fs.existsSync(metaPath)) {
      findings.push({
        file: metaRelativePath,
        error: `localized route template has no prerender shell "${route}"`,
      });
      continue;
    }
    if (!isPrerenderedMeta(readJson(metaPath))) {
      findings.push({
        file: metaRelativePath,
        error: `localized route template is not marked prerendered "${route}"`,
      });
    }
  }
  return findings;
}

function routeUsesLocale(route, locale) {
  return route === `/${locale}` || route.startsWith(`/${locale}/`);
}

function collectTemplateRouteFindings(
  localizedPageTemplates,
  localizedRoutes,
  configuredLocales,
) {
  const findings = [];
  for (const locale of configuredLocales) {
    const prerenderedTemplates = new Set(
      localizedRoutes
        .filter(([route]) => routeUsesLocale(route, locale))
        .map(([, config]) => config.srcRoute),
    );
    for (const route of localizedPageTemplates) {
      if (prerenderedTemplates.has(route)) continue;
      findings.push({
        file: "prerender-manifest.json",
        error: `localized route template has no prerender output for locale "${locale}" "${route}"`,
      });
    }
  }
  return findings;
}

function collectLocalizedRouteFindings({
  buildRoot,
  localizedRoutes,
  postponedRouteExemptions,
}) {
  const findings = [];
  const usedExemptions = new Set();
  for (const [route] of localizedRoutes) {
    const metaRelativePath = getMetaRelativePath(route);
    const metaPath = path.join(buildRoot, metaRelativePath);
    if (!fs.existsSync(metaPath)) {
      findings.push({
        file: metaRelativePath,
        error: `localized route has no prerender output "${route}"`,
      });
      continue;
    }

    const meta = readJson(metaPath);
    if (!isPrerenderedMeta(meta)) {
      findings.push({
        file: metaRelativePath,
        error: `localized route is not marked prerendered "${route}"`,
      });
    }
    if (typeof meta.postponed !== "string") continue;
    if (postponedRouteExemptions.has(route)) usedExemptions.add(route);
    else {
      findings.push({
        file: metaRelativePath,
        error: `localized route unexpectedly keeps postponed rendering "${route}"`,
      });
    }
  }
  return { findings, usedExemptions };
}

function collectStaleExemptionFindings(
  postponedRouteExemptions,
  usedExemptions,
) {
  return [...postponedRouteExemptions]
    .filter(([route]) => !usedExemptions.has(route))
    .map(([route, reason]) => ({
      file: "scripts/quality/checks/prerender-static.js",
      error: `stale postponed-route exemption "${route}": ${reason}`,
    }));
}

function collectPrerenderStaticFindings({
  rootDir = ROOT,
  buildDir = DEFAULT_BUILD_DIR,
  configuredLocales = CONFIGURED_LOCALES,
  postponedRouteExemptions = POSTPONED_ROUTE_EXEMPTIONS,
} = {}) {
  const buildRoot = path.join(rootDir, buildDir);
  const appPathsPath = path.join(buildRoot, "server/app-paths-manifest.json");
  const prerenderPath = path.join(buildRoot, "prerender-manifest.json");
  const missingManifestFindings = collectMissingManifestFindings(rootDir, [
    appPathsPath,
    prerenderPath,
  ]);
  if (missingManifestFindings.length > 0) return missingManifestFindings;

  const appPaths = readJson(appPathsPath);
  const prerenderManifest = readJson(prerenderPath);
  const localizedPageTemplates = Object.keys(appPaths)
    .filter((route) => route.startsWith("/[locale]") && route.endsWith("/page"))
    .map((route) => route.slice(0, -"/page".length))
    .sort();

  const localizedRoutes = Object.entries(prerenderManifest.routes ?? {})
    .filter(
      ([route, config]) =>
        configuredLocales.some((locale) => routeUsesLocale(route, locale)) &&
        typeof config?.srcRoute === "string" &&
        config.srcRoute.startsWith("/[locale]"),
    )
    .sort(([left], [right]) => left.localeCompare(right));
  const routeUsage = collectLocalizedRouteFindings({
    buildRoot,
    localizedRoutes,
    postponedRouteExemptions,
  });

  return [
    ...collectTemplateFindings(buildRoot, localizedPageTemplates),
    ...collectTemplateRouteFindings(
      localizedPageTemplates,
      localizedRoutes,
      configuredLocales,
    ),
    ...routeUsage.findings,
    ...collectStaleExemptionFindings(
      postponedRouteExemptions,
      routeUsage.usedExemptions,
    ),
  ];
}

function runPrerenderStaticCheck() {
  const findings = collectPrerenderStaticFindings();
  if (findings.length === 0) {
    console.log("prerender-static: passed");
    return true;
  }

  console.error("prerender-static: failed");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.error}`);
  }
  return false;
}

module.exports = {
  POSTPONED_ROUTE_EXEMPTIONS,
  collectPrerenderStaticFindings,
  runPrerenderStaticCheck,
};
