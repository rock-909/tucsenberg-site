const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

const ROOT = process.cwd();

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

const CONTENT_READINESS_PROFILE_IDS = new Set([
  "minimal",
  "company-site",
  "b2b-lead",
  "catalog",
  "content-marketing",
  "showcase-full",
]);

const CORE_MESSAGE_NAMESPACES_FOR_READINESS = [
  "common",
  "theme",
  "language",
  "monitoring",
  "accessibility",
  "underConstruction",
  "cookie",
  "structured-data",
  "apiErrors",
  "errors",
  "error",
  "turnstileRequired",
  "errorBoundary",
  "legal",
  "instructions",
  "actions",
  "formatting",
  "progress",
  "themes",
  "title",
  "privacy",
  "terms",
];

const B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS = [
  "navigation",
  "footer",
  "home",
  "contact",
  "formTemplate",
  "stats",
  "email",
  "emailPlaceholder",
  "phone",
  "organization",
  "website",
  "trust",
  "faq",
  "requestQuote",
];

const PROFILE_MESSAGE_NAMESPACE_OWNERSHIP = {
  minimal: new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    "navigation",
    "footer",
    "home",
  ]),
  "b2b-lead": new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    ...B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS,
  ]),
  "company-site": new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    ...B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS,
    "catalog",
    "products",
    "blog",
    "article",
    "resources",
  ]),
  catalog: new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    ...B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS,
    "catalog",
    "products",
  ]),
  "content-marketing": new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    ...B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS,
    "blog",
    "article",
  ]),
  "showcase-full": new Set([
    ...CORE_MESSAGE_NAMESPACES_FOR_READINESS,
    ...B2B_LEAD_MESSAGE_NAMESPACES_FOR_READINESS,
    "catalog",
    "products",
    "blog",
    "article",
    "resources",
    "customProject",
  ]),
};

const PROFILE_MESSAGE_PACK_READINESS = {
  minimal: ["base", "minimal"],
  "company-site": ["base", "minimal", "b2b-lead", "company-site"],
  "b2b-lead": ["base", "minimal", "b2b-lead"],
  catalog: ["base", "minimal", "b2b-lead", "catalog"],
  "content-marketing": ["base", "minimal", "b2b-lead", "content-marketing"],
  "showcase-full": [
    "base",
    "minimal",
    "b2b-lead",
    "catalog",
    "content-marketing",
    "company-site",
    "showcase-full",
  ],
};

const MESSAGE_PACK_READINESS_PATTERNS = {
  base: /^messages\/base\/[^/]+\/(?:critical|deferred)\.json$/u,
  minimal: /^messages\/profiles\/minimal\/[^/]+\/(?:critical|deferred)\.json$/u,
  "b2b-lead":
    /^messages\/profiles\/b2b-lead\/[^/]+\/(?:critical|deferred)\.json$/u,
  "company-site":
    /^messages\/profiles\/company-site\/[^/]+\/(?:critical|deferred)\.json$/u,
  catalog: /^messages\/profiles\/catalog\/[^/]+\/(?:critical|deferred)\.json$/u,
  "content-marketing":
    /^messages\/profiles\/content-marketing\/[^/]+\/(?:critical|deferred)\.json$/u,
  "showcase-full":
    /^messages\/profiles\/showcase-full\/[^/]+\/(?:critical|deferred)\.json$/u,
};

function isProfileOwnedMessagePackPath(repoPath, profileId) {
  const packIds = PROFILE_MESSAGE_PACK_READINESS[profileId];
  if (!packIds) return false;

  return packIds.some((packId) =>
    MESSAGE_PACK_READINESS_PATTERNS[packId].test(repoPath),
  );
}

const PROFILE_MESSAGE_POINTER_EXCLUSIONS = {
  minimal: [
    /^\.home\.products(?:\.|$)/u,
    /^\.home\.resources(?:\.|$)/u,
    /^\.home\.quality\.standards(?:\.|$)/u,
    /^\.footer\.sections\.navigation\.(?:products|blog)(?:\.|$)/u,
    /^\.footer\.platform(?:\.|$)/u,
    /^\.navigation\.(?:products|blog|resources|capabilities|howItWorks|customProject|services|solutions|enterprise)(?:\.|$)/u,
  ],
  "b2b-lead": [
    /^\.home\.products(?:\.|$)/u,
    /^\.home\.resources(?:\.|$)/u,
    /^\.home\.quality\.standards(?:\.|$)/u,
    /^\.footer\.sections\.navigation\.(?:products|blog)(?:\.|$)/u,
    /^\.footer\.platform(?:\.|$)/u,
    /^\.navigation\.(?:products|blog|resources|capabilities|howItWorks|customProject|services|solutions|enterprise)(?:\.|$)/u,
  ],
  "company-site": [
    /^\.home\.quality\.standards(?:\.|$)/u,
    /^\.navigation\.(?:capabilities|howItWorks|customProject|services|solutions|enterprise)(?:\.|$)/u,
  ],
  catalog: [
    /^\.home\.resources(?:\.|$)/u,
    /^\.footer\.sections\.navigation\.blog(?:\.|$)/u,
    /^\.footer\.platform\.resources(?:\.|$)/u,
    /^\.navigation\.(?:blog|resources)(?:\.|$)/u,
  ],
  "content-marketing": [
    /^\.home\.products(?:\.|$)/u,
    /^\.home\.quality\.standards(?:\.|$)/u,
    /^\.footer\.sections\.navigation\.products(?:\.|$)/u,
    /^\.footer\.platform\.products(?:\.|$)/u,
    /^\.navigation\.(?:products|capabilities|howItWorks|customProject)(?:\.|$)/u,
  ],
  "showcase-full": [],
};

const LOGO_REFERENCE = "/images/logo.svg";
const LOGO_ASSET_PATH = "public/images/logo.svg";
const MARKDOWN_LOGO_REFERENCE_PATTERN =
  /!?\[[^\]]*\]\(\s*<?\/images\/logo\.svg>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/iu;
const ATTRIBUTE_LOGO_REFERENCE_PATTERN =
  /\b(?:href|src)\s*=\s*(?:"\/images\/logo\.svg"|'\/images\/logo\.svg'|\{\s*(?:"\/images\/logo\.svg"|'\/images\/logo\.svg'|`\/images\/logo\.svg`)\s*\})/iu;
const READINESS_SCAN_TARGETS = [
  {
    root: "content/pages",
    extensions: new Set([".md", ".mdx"]),
    scanTextRules: true,
  },
  {
    root: "messages",
    extensions: new Set([".json"]),
    allowedPathPattern:
      /^messages\/(?:base\/[^/]+|profiles\/(?:minimal|company-site|b2b-lead|catalog|content-marketing|showcase-full)\/[^/]+|examples\/ui-demo\/[^/]+)\/(?:critical|deferred)\.json$/u,
    scanTextRules: true,
  },
  {
    root: "public/images",
    extensions: new Set([
      ".avif",
      ".gif",
      ".jpg",
      ".jpeg",
      ".png",
      ".svg",
      ".webp",
    ]),
    scanTextRules: false,
    scanPathRules: true,
  },
  {
    root: "src/constants/product-specs",
    extensions: new Set([".js", ".json", ".mjs", ".ts", ".tsx"]),
    scanTextRules: true,
  },
  {
    root: "src/lib/blog",
    extensions: new Set([".js", ".json", ".mjs", ".ts", ".tsx"]),
    allowedPathPattern: /^src\/lib\/blog\/starter-blog\.ts$/u,
    scanTextRules: true,
  },
  {
    root: "src/config",
    extensions: new Set([".ts"]),
    allowedPathPattern:
      /^src\/config\/(?:single-site|single-site-seo|single-site-navigation|single-site-links|single-site-page-expression|single-site-product-catalog)\.ts$/u,
    scanTextRules: true,
  },
  {
    root: "profile-fixtures",
    extensions: new Set([".md", ".mdx", ".ts", ".tsx", ".json"]),
    allowedPathPattern:
      /^profile-fixtures\/(?:catalog|content-marketing|showcase-full)\//u,
    scanTextRules: true,
  },
  {
    root: "public/profile-fixtures",
    extensions: new Set([
      ".avif",
      ".gif",
      ".jpg",
      ".jpeg",
      ".png",
      ".svg",
      ".webp",
    ]),
    scanPathRules: true,
  },
];
const GENERATED_DIR_NAMES = new Set([
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "reports",
  "storybook-static",
]);
const EXCLUDED_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|__mocks__)(?:\/|$)|\.(?:test|spec)\.[^.]+$/u;
const TEXT_RULES = [
  {
    ruleId: "starter-identity",
    severity: "warning",
    pattern:
      /\b(?:Showcase Website Starter|Public Demo Starter Site|Reusable Showcase Website Starter|Showcase Website Starter Team)\b/giu,
    message:
      "Starter site identity is still present. Replace it before client launch.",
  },
  {
    ruleId: "fake-phone",
    severity: "error",
    pattern:
      /(?:\+?1[\s.-]?)?(?:(?:\(?555\)?[\s.-]?\d{3})|(?:\(?\d{3}\)?[\s.-]?555))[\s.-]?\d{4}\b|\b123[\s.-]?456[\s.-]?7890\b/giu,
    message: "Fake phone marker is present in buyer-visible content.",
  },
  {
    ruleId: "sample-product",
    severity: "warning",
    pattern: /\bsample(?:[\s_-]+)product\b/giu,
    message:
      "Starter sample product text is still present. Replace it before launch.",
  },
  {
    ruleId: "replaceable-content",
    severity: "warning",
    pattern: /\breplaceable\b|\breplace with real\b/giu,
    message:
      "Replaceable starter catalog content is still present. Replace it before client launch.",
  },
  {
    ruleId: "example-standard",
    severity: "warning",
    pattern: /\bExample Standard [A-Z]\b/gu,
    message:
      "Example standard marker is still present in catalog truth. Replace it before client launch.",
  },
  {
    ruleId: "example-offer",
    severity: "warning",
    pattern:
      /\b(?:Primary|Secondary|Regional|Platform|Specialty) Offer Example\b/gu,
    message:
      "Example offer marker is still present in catalog truth. Replace it before client launch.",
  },
  {
    ruleId: "replace-this-image",
    severity: "warning",
    pattern: /\breplace this image\b/giu,
    message:
      "Image replacement placeholder is still present. Replace it before launch.",
  },
  {
    ruleId: "todo-marker",
    severity: "error",
    pattern: /\bTODO\b/gu,
    message: "TODO marker is present in buyer-visible content.",
  },
  {
    ruleId: "lorem-ipsum",
    severity: "error",
    pattern: /\blorem ipsum\b/giu,
    message: "Lorem ipsum filler text is still present.",
  },
  {
    ruleId: "your-company",
    severity: "warning",
    pattern: /\byour company\b/giu,
    message:
      "Generic company placeholder text is still present. Replace it before launch.",
  },
  {
    ruleId: "your-email",
    severity: "warning",
    pattern: /\byour@email\b/giu,
    message:
      "Generic email placeholder text is still present. Replace it before launch.",
  },
  {
    ruleId: "placeholder",
    severity: "warning",
    pattern: /\bplaceholder\b/giu,
    message:
      "Placeholder marker is present. Confirm it is intentional before launch.",
  },
  {
    ruleId: "example-domain",
    severity: "warning",
    pattern:
      /\b(?:example\.com|example\.org|example\.net|[\w.-]+\.example|example[-_]domain)\b/giu,
    message:
      "Example domain appears in buyer-visible input. Confirm it is intentional before launch.",
  },
];
const STRICT_CLIENT_LAUNCH_BLOCKER_RULE_IDS = new Set([
  "example-domain",
  "example-offer",
  "example-standard",
  "fake-phone",
  "placeholder",
  "replace-this-image",
  "replaceable-content",
  "sample-product",
  "starter-identity",
  "your-company",
  "your-email",
]);
const CONFIG_SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".ts", ".tsx"]);
const TS_TYPE_ONLY_NODE_TYPES = new Set([
  "TSArrayType",
  "TSConditionalType",
  "TSConstructorType",
  "TSDeclareFunction",
  "TSExportAssignment",
  "TSExpressionWithTypeArguments",
  "TSFunctionType",
  "TSImportEqualsDeclaration",
  "TSIndexSignature",
  "TSIndexedAccessType",
  "TSInferType",
  "TSInstantiationExpression",
  "TSInterfaceBody",
  "TSInterfaceDeclaration",
  "TSIntersectionType",
  "TSLiteralType",
  "TSMappedType",
  "TSMethodSignature",
  "TSModuleBlock",
  "TSModuleDeclaration",
  "TSNamedTupleMember",
  "TSOptionalType",
  "TSParameterProperty",
  "TSParenthesizedType",
  "TSPropertySignature",
  "TSQualifiedName",
  "TSRestType",
  "TSThisType",
  "TSTupleType",
  "TSTypeAliasDeclaration",
  "TSTypeAnnotation",
  "TSTypeAssertion",
  "TSTypeLiteral",
  "TSTypeOperator",
  "TSTypeParameter",
  "TSTypeParameterDeclaration",
  "TSTypeParameterInstantiation",
  "TSTypePredicate",
  "TSTypeQuery",
  "TSTypeReference",
  "TSUnionType",
]);

function isReadinessExcludedPath(repoPath) {
  return (
    repoPath.startsWith("docs/") ||
    repoPath.startsWith("reports/") ||
    repoPath.startsWith("generated/") ||
    EXCLUDED_FILE_PATTERN.test(repoPath)
  );
}

function isReadinessSourceFile(repoPath, filePath, target) {
  if (!target.extensions.has(path.extname(filePath))) return false;
  return target.allowedPathPattern
    ? target.allowedPathPattern.test(repoPath)
    : true;
}

function normalizeContentReadinessProfile(profileId) {
  if (profileId === undefined || profileId === null || profileId === "") {
    return undefined;
  }

  if (!CONTENT_READINESS_PROFILE_IDS.has(profileId)) {
    throw new Error(`Unknown content readiness profile: ${profileId}`);
  }

  return profileId;
}

function isCompanySiteReadinessPath(repoPath) {
  return (
    isB2bLeadReadinessPath(repoPath) ||
    isProfileOwnedMessagePackPath(repoPath, "company-site") ||
    isProfileOwnedMessagePackPath(repoPath, "catalog") ||
    isProfileOwnedMessagePackPath(repoPath, "content-marketing") ||
    isContentMarketingFixtureReadinessPath(repoPath) ||
    repoPath.startsWith("src/lib/blog/") ||
    repoPath.startsWith("public/images/blog/") ||
    repoPath === "src/app/[locale]/resources/page.tsx" ||
    /^src\/app\/\[locale\]\/products\/page\.tsx$/u.test(repoPath)
  );
}

function isB2bLeadReadinessPath(repoPath) {
  return (
    /^content\/pages\/[^/]+\/(?:about|contact|privacy|terms)\.mdx$/u.test(
      repoPath,
    ) ||
    isProfileOwnedMessagePackPath(repoPath, "b2b-lead") ||
    /^messages\/[^/]+\/(?:critical|deferred)\.json$/u.test(repoPath) ||
    /^public\/images\/(?:(?:og-image|about-og)\.(?:jpe?g|png|svg|webp)|hero\/)/u.test(
      repoPath,
    ) ||
    /^src\/config\/(?:single-site|single-site-seo|single-site-navigation|single-site-links)\.ts$/u.test(
      repoPath,
    )
  );
}

function isMinimalReadinessPath(repoPath) {
  return (
    /^content\/pages\/[^/]+\/(?:privacy|terms)\.mdx$/u.test(repoPath) ||
    isProfileOwnedMessagePackPath(repoPath, "minimal") ||
    /^messages\/[^/]+\/(?:critical|deferred)\.json$/u.test(repoPath) ||
    /^public\/images\/(?:(?:og-image)\.(?:jpe?g|png|svg|webp)|hero\/)/u.test(
      repoPath,
    ) ||
    /^src\/config\/(?:single-site|single-site-seo|single-site-navigation|single-site-links)\.ts$/u.test(
      repoPath,
    )
  );
}

function isCatalogFixtureReadinessPath(repoPath) {
  return (
    repoPath.startsWith("profile-fixtures/catalog/") ||
    repoPath.startsWith("public/profile-fixtures/catalog/")
  );
}

function isContentMarketingFixtureReadinessPath(repoPath) {
  return (
    repoPath.startsWith("profile-fixtures/content-marketing/") ||
    repoPath.startsWith("public/profile-fixtures/content-marketing/")
  );
}

function isShowcaseFullFixtureReadinessPath(repoPath) {
  return repoPath.startsWith("profile-fixtures/showcase-full/");
}

function isCatalogReadinessPath(repoPath) {
  return (
    isB2bLeadReadinessPath(repoPath) ||
    isProfileOwnedMessagePackPath(repoPath, "catalog") ||
    isCatalogFixtureReadinessPath(repoPath) ||
    repoPath === "src/config/single-site-page-expression.ts" ||
    repoPath === "src/config/single-site-product-catalog.ts" ||
    repoPath.startsWith("src/constants/product-specs/") ||
    repoPath.startsWith("public/images/products/")
  );
}

function isContentMarketingReadinessPath(repoPath) {
  return (
    isB2bLeadReadinessPath(repoPath) ||
    isProfileOwnedMessagePackPath(repoPath, "content-marketing") ||
    isContentMarketingFixtureReadinessPath(repoPath) ||
    repoPath.startsWith("src/lib/blog/") ||
    repoPath.startsWith("public/images/blog/")
  );
}

function isShowcaseFullReadinessPath(repoPath) {
  return (
    isCatalogReadinessPath(repoPath) ||
    isContentMarketingReadinessPath(repoPath) ||
    isProfileOwnedMessagePackPath(repoPath, "showcase-full") ||
    isShowcaseFullFixtureReadinessPath(repoPath) ||
    /^content\/pages\/[^/]+\/(?:capabilities|how-it-works|custom-project-support)\.mdx$/u.test(
      repoPath,
    )
  );
}

function isProfileOwnedReadinessPath(repoPath, profileId) {
  switch (profileId) {
    case undefined:
      return true;
    case "minimal":
      return isMinimalReadinessPath(repoPath);
    case "company-site":
      return isCompanySiteReadinessPath(repoPath);
    case "b2b-lead":
      return isB2bLeadReadinessPath(repoPath);
    case "catalog":
      return isCatalogReadinessPath(repoPath);
    case "content-marketing":
      return isContentMarketingReadinessPath(repoPath);
    case "showcase-full":
      return isShowcaseFullReadinessPath(repoPath);
    default:
      return false;
  }
}

function collectReadinessFiles(rootDir, target, profileId) {
  const results = [];
  const startPath = path.join(rootDir, target.root);
  if (!fs.existsSync(startPath)) return results;

  function walk(currentPath) {
    const repoPath = toRepoPath(rootDir, currentPath);
    if (isReadinessExcludedPath(repoPath)) return;

    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      if (GENERATED_DIR_NAMES.has(path.basename(currentPath))) return;

      const entries = fs
        .readdirSync(currentPath, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name));
      for (const entry of entries) walk(path.join(currentPath, entry.name));
      return;
    }

    if (
      stats.isFile() &&
      isReadinessSourceFile(repoPath, currentPath, target) &&
      isProfileOwnedReadinessPath(repoPath, profileId)
    ) {
      results.push({
        absolutePath: currentPath,
        repoPath,
        scanTextRules: target.scanTextRules,
        scanPathRules: target.scanPathRules ?? false,
      });
    }
  }

  walk(startPath);
  return results;
}

function getLineText(content, index) {
  const lineStart = content.lastIndexOf("\n", index - 1) + 1;
  const lineEnd = content.indexOf("\n", index);
  return content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
}

function getEffectiveSeverity(rule, scanUnit, index, options = {}) {
  const strictClientLaunch = options.strictClientLaunch === true;
  if (
    strictClientLaunch &&
    STRICT_CLIENT_LAUNCH_BLOCKER_RULE_IDS.has(rule.ruleId)
  ) {
    return "error";
  }

  if (rule.ruleId !== "fake-phone") return rule.severity;
  if (/placeholder/iu.test(scanUnit.context ?? "")) return "warning";
  if (/placeholder/iu.test(getLineText(scanUnit.value, index))) {
    return "warning";
  }
  return rule.severity;
}

function toJsonStringLiteral(value) {
  return JSON.stringify(value);
}

function getNextNonWhitespaceCharacter(content, index) {
  for (
    let currentIndex = index;
    currentIndex < content.length;
    currentIndex += 1
  ) {
    const character = content[currentIndex];
    if (!/\s/u.test(character)) return character;
  }
  return "";
}

function findJsonValueLiteralIndex(content, literal, startIndex) {
  let searchIndex = startIndex;

  while (searchIndex < content.length) {
    const literalIndex = content.indexOf(literal, searchIndex);
    if (literalIndex === -1) return -1;

    const nextCharacter = getNextNonWhitespaceCharacter(
      content,
      literalIndex + literal.length,
    );
    if (nextCharacter !== ":") return literalIndex;

    searchIndex = literalIndex + literal.length;
  }

  return -1;
}

function collectJsonStringValues(value, content, state, pointer = "") {
  if (typeof value === "string") {
    const literal = toJsonStringLiteral(value);
    const literalIndex = findJsonValueLiteralIndex(
      content,
      literal,
      state.searchIndex,
    );
    if (literalIndex !== -1) state.searchIndex = literalIndex + literal.length;

    return [
      {
        value,
        line:
          literalIndex === -1 ? 1 : getLineNumber(content, literalIndex + 1),
        context: pointer,
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectJsonStringValues(item, content, state, `${pointer}.${index}`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      collectJsonStringValues(item, content, state, `${pointer}.${key}`),
    );
  }

  return [];
}

function collectJsonScanUnits(content) {
  try {
    return collectJsonStringValues(JSON.parse(content), content, {
      searchIndex: 0,
    });
  } catch {
    return [{ value: content, line: 1 }];
  }
}

function isSkippableConfigString(value) {
  return (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    /^https?:\/\/\S+\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/iu.test(value)
  );
}

function pushConfigStringUnit(units, value, content, node) {
  if (!value) return;

  units.push({
    value,
    line: node.loc?.start.line ?? getLineNumber(content, node.start ?? 0),
    skipTextRules: isSkippableConfigString(value),
  });
}

function collectStringLiteralsFromNode(node, units, content) {
  if (!node || typeof node !== "object") return;
  if (TS_TYPE_ONLY_NODE_TYPES.has(node.type)) return;
  if (node.type === "ImportDeclaration") return;
  if (node.type === "ExportAllDeclaration") return;

  if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    collectStringLiteralsFromNode(node.declaration, units, content);
    return;
  }

  if (
    (node.type === "StringLiteral" || node.type === "DirectiveLiteral") &&
    typeof node.value === "string"
  ) {
    pushConfigStringUnit(units, node.value, content, node);
    return;
  }

  if (node.type === "TemplateElement") {
    const value = node.value?.cooked ?? node.value?.raw;
    pushConfigStringUnit(units, value, content, node);
    return;
  }

  if (node.type === "ObjectProperty" || node.type === "ObjectMethod") {
    if (node.computed) collectStringLiteralsFromNode(node.key, units, content);
    collectStringLiteralsFromNode(node.value ?? node.body, units, content);
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (
      key === "comments" ||
      key === "leadingComments" ||
      key === "innerComments" ||
      key === "trailingComments" ||
      key === "loc" ||
      key === "start" ||
      key === "end"
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value)
        collectStringLiteralsFromNode(item, units, content);
      continue;
    }

    collectStringLiteralsFromNode(value, units, content);
  }
}

function collectConfigStringScanUnits(content) {
  const units = [];

  try {
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    collectStringLiteralsFromNode(ast.program, units, content);
  } catch {
    return [];
  }

  return units;
}

function collectPathScanUnits(repoPath) {
  return [{ value: repoPath, line: 1 }];
}

function stripMdxComments(content) {
  return content.replaceAll(/\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/gu, (match) =>
    "\n".repeat(match.split("\n").length - 1),
  );
}

function collectScanUnits(content, filePath) {
  const extension = path.extname(filePath);
  if (extension === ".json") return collectJsonScanUnits(content);
  if (CONFIG_SOURCE_EXTENSIONS.has(extension)) {
    return collectConfigStringScanUnits(content);
  }

  const scanContent =
    extension === ".md" || extension === ".mdx"
      ? stripMdxComments(content)
      : content;

  return scanContent.split("\n").map((line, index) => ({
    value: line,
    line: index + 1,
  }));
}

function isContentRuntimeLogoReference(file, unit) {
  return (
    file.repoPath.startsWith("content/pages/") &&
    (MARKDOWN_LOGO_REFERENCE_PATTERN.test(unit.value) ||
      ATTRIBUTE_LOGO_REFERENCE_PATTERN.test(unit.value))
  );
}

function findRuntimeLogoReferenceUnit(file, scanUnits) {
  if (file.scanPathRules) return undefined;

  return scanUnits.find((unit) => isContentRuntimeLogoReference(file, unit));
}

function getMessageNamespaceFromPointer(pointer) {
  if (typeof pointer !== "string") return undefined;
  return pointer.split(".").filter(Boolean)[0];
}

function isProfileOwnedMessageUnit(file, unit, profileId) {
  if (profileId === undefined) return true;
  if (!file.repoPath.startsWith("messages/")) return true;

  const isPackFile =
    /^messages\/(?:base\/|profiles\/|examples\/)/u.test(file.repoPath) &&
    !/^messages\/[^/]+\/(?:critical|deferred)\.json$/u.test(file.repoPath);

  if (isPackFile && !isProfileOwnedMessagePackPath(file.repoPath, profileId)) {
    return false;
  }

  const pointer = typeof unit.context === "string" ? unit.context : "";
  const namespace = getMessageNamespaceFromPointer(pointer);
  if (namespace === undefined) return true;

  if (!PROFILE_MESSAGE_NAMESPACE_OWNERSHIP[profileId]?.has(namespace)) {
    return false;
  }

  const exclusions = PROFILE_MESSAGE_POINTER_EXCLUSIONS[profileId] ?? [];
  for (const pattern of exclusions) {
    if (pattern.test(pointer)) return false;
  }

  return true;
}

function scanReadinessFile(rootDir, file, options = {}) {
  const content = fs.readFileSync(file.absolutePath, "utf8");
  const scanUnits = file.scanPathRules
    ? collectPathScanUnits(file.repoPath)
    : collectScanUnits(content, file.absolutePath);
  const findings = [];

  for (const unit of scanUnits) {
    if (unit.skipTextRules) continue;
    if (!isProfileOwnedMessageUnit(file, unit, options.profileId)) continue;

    for (const rule of TEXT_RULES) {
      rule.pattern.lastIndex = 0;

      for (const match of unit.value.matchAll(rule.pattern)) {
        const index = match.index ?? 0;
        findings.push({
          file: file.repoPath,
          line: unit.line,
          ruleId: rule.ruleId,
          severity: getEffectiveSeverity(rule, unit, index, options),
          message: rule.message,
          match: match[0],
        });
      }
    }
  }

  const logoReferenceUnit = findRuntimeLogoReferenceUnit(file, scanUnits);
  const hasLogoReference = Boolean(logoReferenceUnit);
  const hasLogoAsset = fs.existsSync(path.join(rootDir, LOGO_ASSET_PATH));
  if (hasLogoReference && !hasLogoAsset) {
    findings.push({
      file: file.repoPath,
      line: logoReferenceUnit.line,
      ruleId: "missing-logo-asset",
      severity: "error",
      message:
        "Runtime reference to /images/logo.svg exists, but public/images/logo.svg is missing.",
      match: LOGO_REFERENCE,
    });
  }

  return findings;
}

function collectContentReadinessFindings(rootDir = ROOT, options = {}) {
  const profileId = normalizeContentReadinessProfile(options.profileId);
  const files = READINESS_SCAN_TARGETS.flatMap((target) =>
    collectReadinessFiles(rootDir, target, profileId),
  );
  return files.flatMap((file) =>
    file.scanTextRules || file.scanPathRules
      ? scanReadinessFile(rootDir, file, { ...options, profileId })
      : [],
  );
}

function runContentReadinessCheck(rootDir = ROOT, options = {}) {
  const findings = collectContentReadinessFindings(rootDir, options);
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");

  return {
    status: errors.length > 0 ? "failed" : "passed",
    findings,
    errors,
    warnings,
  };
}

function printReadinessFinding(finding) {
  const suffix = finding.match ? ` (${finding.match})` : "";
  console.error(
    `- [${finding.severity}] ${finding.file}:${finding.line} ${finding.ruleId}: ${finding.message}${suffix}`,
  );
}

function getCliOptionValue(args, optionName) {
  const equalsPrefix = `${optionName}=`;
  const equalsMatch = args.find((arg) => arg.startsWith(equalsPrefix));
  if (equalsMatch) return equalsMatch.slice(equalsPrefix.length);

  const optionIndex = args.indexOf(optionName);
  if (optionIndex === -1) return undefined;
  return args[optionIndex + 1];
}

function runContentReadinessCli(args = []) {
  const profileId = getCliOptionValue(args, "--profile");
  const result = runContentReadinessCheck(ROOT, {
    profileId,
    strictClientLaunch: args.includes("--strict-client-launch"),
  });

  const profileLabel = profileId ? ` for profile ${profileId}` : "";

  if (result.findings.length === 0) {
    console.log(
      `content readiness passed${profileLabel}: no buyer-visible residue found`,
    );
    return true;
  }

  const summary = `content readiness ${result.status}${profileLabel}: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`;
  const log = result.status === "failed" ? console.error : console.log;
  log(summary);
  for (const finding of result.findings) printReadinessFinding(finding);

  return result.status !== "failed";
}

module.exports = {
  CONTENT_READINESS_PROFILE_IDS,
  collectContentReadinessFindings,
  runContentReadinessCheck,
  runContentReadinessCli,
};
