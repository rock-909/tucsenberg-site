#!/usr/bin/env node

const { runBrandCheck } = require("./quality/checks/brand");
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
  hasTopLevelUseClientDirective,
  runClientBoundaryBudgetCheck,
  runClientBoundaryCli,
} = require("./quality/checks/client-boundary");
const {
  analyzeFile,
  analyzeSource,
  collectRegisteredGuardrailExceptionIds,
  getActiveGuardrailExceptionSection,
  isProductionFile,
  isStructuralGuardrailExemptPath,
  isTestFile,
  parseGuardrailException,
  runEslintDisableCheck,
  STRUCTURAL_GUARDRAIL_RULES,
} = require("./quality/checks/eslint-disable");
const {
  collectLeafPaths,
  compareLocales,
  runTranslationCheck,
  validateLocale,
} = require("./quality/checks/translations");
const {
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  getReleaseProofDocsCommandBlock,
  runReleaseVerify,
} = require("./quality/checks/release-verify");
const {
  CHECKS: TRUTH_DOC_CHECKS,
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS,
  RETIRED_CURRENT_TRUTH_PATTERNS,
  collectCurrentTruthDocFindings,
  findCommandLineIndex,
  findOutOfOrderCommand,
  runTruthDocsCheck,
} = require("./quality/checks/current-truth-docs");
const {
  collectCloudflareOfficialCompareFailures,
  runCloudflareOfficialCompareCli,
} = require("./quality/checks/cloudflare-official-compare");
const {
  runCloudflareStaticAssetHeaderCli,
} = require("./quality/checks/cloudflare-static-asset-headers");
const {
  runValidateProductionConfigCli,
  shouldValidateProductionRuntimeContract,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
} = require("./quality/checks/production-config");
const {
  CONTENT_READINESS_PROFILE_IDS,
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
// truth docs
// ---------------------------------------------------------------------------

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
  truth-docs          Check current truth docs and release runbook order
  brand               Check old brand residue
  content-slugs       Check localized MDX slug pairs
  content-manifest    Generate content manifest and static MDX import map (--check verifies freshness)
  translations        Check split critical/deferred translation shapes
  validate-production-config Validate production and public-launch config gates
  eslint-disable      Check eslint-disable exception hygiene
  component-governance Check component registry, Storybook, and UI wrapper drift
  content-readiness   Check buyer-visible catalog residue (--strict-client-launch promotes launch blockers to errors)
  client-boundary     Check top-level use client budget
  cf-preview-smoke    Probe local Cloudflare preview behavior
  public-preview-smoke Probe public preview page route health
  deployed-smoke      Probe deployed URL route health
  cf-preview-deployed Deploy preview workers and run deployed smoke
  cf-official-compare Check Cloudflare source/generated deploy config contract
  cf-static-asset-headers Check Cloudflare Static Assets _headers artifact
  release-verify      Run full release verification flow
`);
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const commandHandlers = {
    "truth-docs": () => runTruthDocsCheck(),
    brand: () => runBrandCheck(),
    "content-slugs": () => runContentSlugCheck(args),
    "content-manifest": () =>
      runContentManifestGenerator(createContentManifestContext(), {
        check: args.includes("--check"),
      }),
    translations: () => runTranslationCheck(),
    "validate-production-config": () => runValidateProductionConfigCli(),
    "eslint-disable": () => runEslintDisableCheck(),
    "component-governance": () => runComponentGovernanceCli(),
    "content-readiness": () => runContentReadinessCli(args),
    "client-boundary": () => runClientBoundaryCli(),
    "cf-preview-smoke": () => runCloudflarePreviewSmoke(args),
    "public-preview-smoke": () => runPublicPreviewSmoke(args),
    "deployed-smoke": () => runDeployedSmoke(args),
    "cf-preview-deployed": () => runCloudflarePreviewDeployedProof(),
    "cf-official-compare": () => runCloudflareOfficialCompareCli(args),
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

  const handler = commandHandlers[command];
  const ok = handler ? await handler() : false;

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
  CONTENT_READINESS_PROFILE_IDS,
  CHECKS: TRUTH_DOC_CHECKS,
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS,
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  RETIRED_CURRENT_TRUTH_PATTERNS,
  formatReleaseCommand,
  analyzeFile,
  analyzeSource,
  buildKey,
  collectClientBoundaryFiles,
  collectCloudflareOfficialCompareFailures,
  collectComponentGovernanceFindings,
  collectContentReadinessFindings,
  collectCurrentTruthDocFindings,
  collectLeafPaths,
  collectPairs,
  collectRegisteredGuardrailExceptionIds,
  compareLocales,
  createContentManifestContext,
  findCommandLineIndex,
  findOutOfOrderCommand,
  assertContentManifestFrontmatterValid,
  generateContentManifest,
  writeFileAtomic,
  getActiveGuardrailExceptionSection,
  getReleaseProofDocsCommandBlock,
  hasTopLevelUseClientDirective,
  isProductionFile,
  isStructuralGuardrailExemptPath,
  isTestFile,
  parseArgs: parseContentSlugArgs,
  parseFrontmatter,
  parseGuardrailException,
  runBrandCheck,
  runCloudflareOfficialCompareCli,
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runClientBoundaryBudgetCheck,
  runComponentGovernanceCli,
  runContentManifestGenerator,
  runContentReadinessCheck,
  runContentSlugCheck,
  runDeployedSmoke,
  runEslintDisableCheck,
  runReleaseVerify,
  runTranslationCheck,
  runValidateProductionConfigCli,
  STRUCTURAL_GUARDRAIL_RULES,
  shouldValidateProductionRuntimeContract,
  validateContentFrontmatterContract,
  validateCollectionPair,
  validateLocale,
  validateMdxSlugSync,
  validateProductionConfig,
  validateProductionRuntimeContract,
  validatePublicLaunchTrustContent,
};
