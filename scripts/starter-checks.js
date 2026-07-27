#!/usr/bin/env node

const {
  runVitestCollectionCheck,
} = require("./quality/checks/vitest-collection");
const {
  collectComponentGovernanceFindings,
  runComponentGovernanceCli,
} = require("./quality/checks/component-governance");
const {
  assertContentManifestFrontmatterValid,
  createContentManifestContext,
  generateContentManifest,
  runContentManifestGenerator,
  writeFileAtomic,
} = require("./quality/checks/content-manifest");
const {
  buildKey,
  collectPairs,
  parseContentSlugArgs,
  parseFrontmatter,
  runContentSlugCheck,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateMdxSlugSync,
} = require("./quality/checks/content-slugs");
const {
  collectClientBoundaryFiles,
  collectForbiddenBuildSources,
  collectInquiryFormBuildArtifactFindings,
  hasTopLevelUseClientDirective,
  INQUIRY_FORM_CHUNK_MARKER,
  INQUIRY_FORM_MAX_RAW_BYTES,
  INQUIRY_FORM_SOURCE,
  runClientBoundaryBudgetCheck,
  runClientBoundaryBuildArtifactsCli,
  runClientBoundaryCli,
  runInquiryFormBuildArtifactCheck,
} = require("./quality/checks/client-boundary");
const {
  collectLeafPaths,
  compareLocales,
  runTranslationCheck,
  validateLocale,
} = require("./quality/checks/translations");
const {
  collectMessageKeyUsageFindings,
  runMessageKeyUsageCheck,
} = require("./quality/checks/message-key-usage");
const {
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  getReleaseProofDocsCommandBlock,
  runReleaseVerify,
} = require("./quality/checks/release-verify");
const {
  collectCloudflareOfficialCompareFailures,
  runCloudflareOfficialCompareCli,
} = require("./quality/checks/cloudflare-official-compare");
const {
  runCloudflareStaticAssetHeaderCli,
} = require("./quality/checks/cloudflare-static-asset-headers");
const {
  collectPrerenderStaticFindings,
  runPrerenderStaticCheck,
} = require("./quality/checks/prerender-static");
const {
  runValidateProductionConfigCli,
  shouldValidateProductionRuntimeContract,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
} = require("./quality/checks/production-config");
const {
  collectContentReadinessFindings,
  runContentReadinessCheck,
  runContentReadinessCli,
} = require("./quality/checks/content-readiness");
const {
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runDeployedSmoke,
  runPublicPreviewSmoke,
} = require("./quality/checks/cloudflare-smoke");

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Cloudflare official compare
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Cloudflare preview and deployed smoke
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CLI routing
// ---------------------------------------------------------------------------

function printUsage() {
  console.error(`Usage: node scripts/starter-checks.js <command> [options]

Commands:
  vitest-collection   Check vitest runs every test file on disk
  content-slugs       Check localized MDX slug pairs
  content-manifest    Generate content manifest only (--check verifies freshness)
  translations        Check catalog message pack and compat translation shapes
  message-key-usage   Check message catalog leaves against real consumers
  validate-production-config Validate production and public-launch config gates
  component-governance Check component registry, Storybook, and UI wrapper drift
  content-readiness   Check buyer-visible catalog residue (--strict-client-launch promotes launch blockers to errors)
  client-boundary     Check top-level use client budget (--build-artifacts after pnpm build)
  prerender-static    Check localized Next.js build output stays prerendered
  cf-preview-smoke    Probe local Cloudflare preview behavior
  public-preview-smoke Probe public preview page route health
  deployed-smoke      Probe deployed URL route health
  cf-preview-deployed Deploy preview workers and run deployed smoke
  cf-official-compare Check Cloudflare source/generated deploy config contract
  cf-static-asset-headers Check Cloudflare Static Assets _headers artifact
  release-verify      Run full release verification flow
`);
}

// Module scope so callers can ask which commands exist. Tests that want to
// prove a package script is wired to a real check need the command list, not a
// frozen copy of the command string.
const COMMAND_HANDLERS = {
  "vitest-collection": () => runVitestCollectionCheck(),
  "content-slugs": (args) => runContentSlugCheck(args),
  "content-manifest": (args) =>
    runContentManifestGenerator(createContentManifestContext(), {
      check: args.includes("--check"),
    }),
  translations: () => runTranslationCheck(),
  "message-key-usage": () => runMessageKeyUsageCheck(),
  "validate-production-config": () => runValidateProductionConfigCli(),
  "component-governance": () => runComponentGovernanceCli(),
  "content-readiness": (args) => runContentReadinessCli(args),
  "client-boundary": (args) => runClientBoundaryCli(args),
  "prerender-static": () => runPrerenderStaticCheck(),
  "cf-preview-smoke": (args) => runCloudflarePreviewSmoke(args),
  "public-preview-smoke": (args) => runPublicPreviewSmoke(args),
  "deployed-smoke": (args) => runDeployedSmoke(args),
  "cf-preview-deployed": () => runCloudflarePreviewDeployedProof(),
  "cf-official-compare": (args) => runCloudflareOfficialCompareCli(args),
  "cf-static-asset-headers": () =>
    runCloudflareStaticAssetHeaderCli({ rootDir: ROOT }),
  "release-verify": () => runReleaseVerify({ rootDir: ROOT }),
  "--help": () => {
    printUsage();
    return true;
  },
  "-h": () => {
    printUsage();
    return true;
  },
};

const STARTER_CHECK_COMMANDS = Object.keys(COMMAND_HANDLERS).filter(
  (command) => !command.startsWith("-"),
);

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const handler = COMMAND_HANDLERS[command];
  const ok = handler ? await handler(args) : false;

  if (!handler) {
    printUsage();
  }

  if (typeof ok === "number") {
    process.exitCode = ok;
  } else if (!ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[starter-checks] Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = {
  STARTER_CHECK_COMMANDS,
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  buildKey,
  collectClientBoundaryFiles,
  collectForbiddenBuildSources,
  collectInquiryFormBuildArtifactFindings,
  collectCloudflareOfficialCompareFailures,
  collectComponentGovernanceFindings,
  collectContentReadinessFindings,
  collectLeafPaths,
  collectMessageKeyUsageFindings,
  collectPairs,
  collectPrerenderStaticFindings,
  compareLocales,
  createContentManifestContext,
  assertContentManifestFrontmatterValid,
  generateContentManifest,
  writeFileAtomic,
  getReleaseProofDocsCommandBlock,
  hasTopLevelUseClientDirective,
  INQUIRY_FORM_CHUNK_MARKER,
  INQUIRY_FORM_MAX_RAW_BYTES,
  INQUIRY_FORM_SOURCE,
  parseArgs: parseContentSlugArgs,
  parseFrontmatter,
  runCloudflareOfficialCompareCli,
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runClientBoundaryBudgetCheck,
  runClientBoundaryBuildArtifactsCli,
  runInquiryFormBuildArtifactCheck,
  runComponentGovernanceCli,
  runContentManifestGenerator,
  runContentReadinessCheck,
  runContentSlugCheck,
  runDeployedSmoke,
  runReleaseVerify,
  runTranslationCheck,
  runValidateProductionConfigCli,
  shouldValidateProductionRuntimeContract,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateLocale,
  validateMdxSlugSync,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
};
