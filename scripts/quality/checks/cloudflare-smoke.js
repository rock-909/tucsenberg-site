const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const DEFAULT_CF_PREVIEW_BASE_URL =
  process.env.CLOUDFLARE_PREVIEW_BASE_URL || "http://127.0.0.1:8787";
const DEFAULT_DEPLOY_SMOKE_BASE_URL = process.env.DEPLOY_SMOKE_BASE_URL || "";
const DEFAULT_PUBLIC_PREVIEW_SMOKE_BASE_URL = DEFAULT_DEPLOY_SMOKE_BASE_URL;
const DEPLOY_SMOKE_REQUEST_TIMEOUT_MS = 30000;
const DEPLOY_SMOKE_REQUEST_RETRIES = 2;
const DEPLOY_SMOKE_RETRY_DELAY_MS = 1000;
const PUBLIC_PREVIEW_SMOKE_PATHS = [
  "/",
  "/en/",
  "/zh/",
  "/en/contact/",
  "/zh/contact/",
];
const CF_PREVIEW_PROOF_OUTPUT_PATH = path.join(
  ROOT,
  "reports",
  "deploy",
  "cloudflare-preview-proof.json",
);
const CF_PREVIEW_DEPLOY_COMMAND = [
  "exec",
  "opennextjs-cloudflare",
  "deploy",
  "--env",
  "preview",
];
const CF_PREVIEW_URL_PATTERN = new RegExp(
  "https://[^\\s\\\"']+\\.workers\\.dev",
  "gi",
);
const CF_PREVIEW_DEPLOY_URL_PATTERN = CF_PREVIEW_URL_PATTERN;

function parseCloudflarePreviewSmokeArgs(args) {
  const parsed = {
    baseUrl: DEFAULT_CF_PREVIEW_BASE_URL,
    includeApiHealth: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") continue;

    if (arg === "--base-url" && i + 1 < args.length) {
      parsed.baseUrl = args[++i];
      continue;
    }

    if (arg === "--include-api-health") {
      parsed.includeApiHealth = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function normalizeSetCookieFlags(cookieHeader) {
  return cookieHeader
    .split(";")
    .slice(1)
    .flatMap((part) => {
      const flag = part.trim().toLowerCase();
      return flag && !flag.startsWith("expires=") ? [flag] : [];
    })
    .sort();
}

async function requestCloudflarePreviewSmoke(baseUrl, pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "cloudflare-preview-smoke",
    },
  });

  return {
    pathname,
    status: response.status,
    location: response.headers.get("location"),
    setCookie: response.headers.get("set-cookie"),
    leakedMiddlewareCookie: response.headers.get("x-middleware-set-cookie"),
    body: await response.text(),
  };
}

function pushFailureUnless(condition, message, failures) {
  if (!condition) failures.push(message);
}

function parsePublicPreviewSmokeArgs(args) {
  const parsed = {
    baseUrl: DEFAULT_PUBLIC_PREVIEW_SMOKE_BASE_URL,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") continue;

    if (arg === "--base-url" && i + 1 < args.length) {
      parsed.baseUrl = args[++i];
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!parsed.baseUrl) {
    throw new Error("Missing required --base-url");
  }

  return parsed;
}

async function requestPublicPreviewSmoke(baseUrl, pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "public-preview-smoke",
    },
    signal: AbortSignal.timeout(DEPLOY_SMOKE_REQUEST_TIMEOUT_MS),
  });

  return {
    pathname,
    status: response.status,
    body: await response.text(),
  };
}

async function runPublicPreviewSmoke(args = []) {
  const { baseUrl } = parsePublicPreviewSmokeArgs(args);
  const failures = [];

  console.log(`[public-preview-smoke] Probing ${baseUrl}`);

  const responses = [];
  for (const pathname of PUBLIC_PREVIEW_SMOKE_PATHS) {
    responses.push(await requestPublicPreviewSmoke(baseUrl, pathname));
  }

  for (const response of responses) {
    pushFailureUnless(
      response.status === 200,
      `Expected ${response.pathname} to return 200, got ${response.status}`,
      failures,
    );
    pushFailureUnless(
      !response.body.includes("Unexpected loadManifest"),
      `Unexpected manifest loader failure surfaced on ${response.pathname}`,
      failures,
    );
    pushFailureUnless(
      !response.body.includes("Application error"),
      `Unexpected application error surfaced on ${response.pathname}`,
      failures,
    );
  }

  if (failures.length > 0) {
    console.error("[public-preview-smoke] Failures detected:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    return false;
  }

  console.log("[public-preview-smoke] All checks passed");
  return true;
}

async function runCloudflarePreviewSmoke(args = []) {
  const { baseUrl, includeApiHealth } = parseCloudflarePreviewSmokeArgs(args);
  const failures = [];

  console.log(
    `[cf-preview-smoke] Probing ${baseUrl} (${includeApiHealth ? "strict" : "page/header"} mode)`,
  );

  const rootResponse = await requestCloudflarePreviewSmoke(baseUrl, "/");
  const invalidLocaleResponse = await requestCloudflarePreviewSmoke(
    baseUrl,
    "/invalid/contact",
  );
  const invalidLocaleDynamicResponse = await requestCloudflarePreviewSmoke(
    baseUrl,
    "/fr/products/eu/fittings",
  );
  const pageResponses = await Promise.all([
    requestCloudflarePreviewSmoke(baseUrl, "/en"),
    requestCloudflarePreviewSmoke(baseUrl, "/zh"),
    requestCloudflarePreviewSmoke(baseUrl, "/en/contact"),
    requestCloudflarePreviewSmoke(baseUrl, "/zh/contact"),
  ]);
  const apiHealthResponse = includeApiHealth
    ? await requestCloudflarePreviewSmoke(baseUrl, "/api/health")
    : null;

  pushFailureUnless(
    [200, 307, 308].includes(rootResponse.status),
    `Expected / to return 200/307/308, got ${rootResponse.status}`,
    failures,
  );

  if ([307, 308].includes(rootResponse.status)) {
    pushFailureUnless(
      rootResponse.location === "/en",
      `Expected / redirect location to be /en, got ${rootResponse.location ?? "(missing)"}`,
      failures,
    );
  }

  pushFailureUnless(
    [307, 308].includes(invalidLocaleResponse.status),
    `Expected /invalid/contact to redirect, got ${invalidLocaleResponse.status}`,
    failures,
  );
  pushFailureUnless(
    invalidLocaleResponse.location === "/en/contact",
    `Expected /invalid/contact redirect location to be /en/contact, got ${invalidLocaleResponse.location ?? "(missing)"}`,
    failures,
  );
  pushFailureUnless(
    [307, 308].includes(invalidLocaleDynamicResponse.status),
    `Expected /fr/products/eu/fittings to redirect, got ${invalidLocaleDynamicResponse.status}`,
    failures,
  );
  pushFailureUnless(
    invalidLocaleDynamicResponse.location === "/en/products/eu/fittings",
    `Expected /fr/products/eu/fittings redirect location to be /en/products/eu/fittings, got ${invalidLocaleDynamicResponse.location ?? "(missing)"}`,
    failures,
  );

  for (const response of [
    rootResponse,
    invalidLocaleResponse,
    invalidLocaleDynamicResponse,
    ...pageResponses,
    ...(apiHealthResponse ? [apiHealthResponse] : []),
  ]) {
    pushFailureUnless(
      response.leakedMiddlewareCookie === null,
      `Unexpected x-middleware-set-cookie leak on ${response.pathname}`,
      failures,
    );
  }

  for (const response of pageResponses) {
    pushFailureUnless(
      response.status === 200,
      `Expected ${response.pathname} to return 200, got ${response.status}`,
      failures,
    );
    pushFailureUnless(
      !response.body.includes("Unexpected loadManifest"),
      `Unexpected manifest loader failure surfaced on ${response.pathname}`,
      failures,
    );
  }

  if (apiHealthResponse) {
    pushFailureUnless(
      apiHealthResponse.status === 200,
      `Expected /api/health to return 200, got ${apiHealthResponse.status}`,
      failures,
    );
    pushFailureUnless(
      !apiHealthResponse.body.includes("Unexpected loadManifest"),
      "Unexpected manifest loader failure surfaced on /api/health",
      failures,
    );
  } else {
    console.log(
      "[cf-preview-smoke] Skipping /api/health (diagnostic-only in local preview).",
    );
    console.log(
      "[cf-preview-smoke] Policy: local preview proves page/header/cookie behavior. API proof belongs to deployed smoke.",
    );
    console.log("[cf-preview-smoke] Reference: .claude/rules/cloudflare.md");
  }

  if (
    rootResponse.setCookie &&
    invalidLocaleResponse.setCookie &&
    invalidLocaleDynamicResponse.setCookie
  ) {
    const rootFlags = normalizeSetCookieFlags(rootResponse.setCookie);
    const invalidFlags = normalizeSetCookieFlags(
      invalidLocaleResponse.setCookie,
    );
    const invalidDynamicFlags = normalizeSetCookieFlags(
      invalidLocaleDynamicResponse.setCookie,
    );
    pushFailureUnless(
      JSON.stringify(rootFlags) === JSON.stringify(invalidFlags),
      `NEXT_LOCALE cookie flags differ between / and /invalid/contact (${rootFlags.join(", ") || "none"} vs ${invalidFlags.join(", ") || "none"})`,
      failures,
    );
    pushFailureUnless(
      JSON.stringify(rootFlags) === JSON.stringify(invalidDynamicFlags),
      `NEXT_LOCALE cookie flags differ between / and /fr/products/eu/fittings (${rootFlags.join(", ") || "none"} vs ${invalidDynamicFlags.join(", ") || "none"})`,
      failures,
    );
  }

  if (failures.length > 0) {
    console.error("[cf-preview-smoke] Failures detected:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    return false;
  }

  console.log("[cf-preview-smoke] All checks passed");
  return true;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getDeploySmokeRetryDelayMs(attempt) {
  return DEPLOY_SMOKE_RETRY_DELAY_MS * 2 ** attempt;
}

function parseDeployedSmokeArgs(args) {
  const parsed = {
    baseUrl: DEFAULT_DEPLOY_SMOKE_BASE_URL,
    headerName: process.env.DEPLOY_SMOKE_HEADER_NAME || "",
    headerValue: process.env.DEPLOY_SMOKE_HEADER_VALUE || "",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") continue;

    if (arg === "--base-url" && i + 1 < args.length) {
      parsed.baseUrl = args[++i];
      continue;
    }

    if (arg === "--header-name" && i + 1 < args.length) {
      parsed.headerName = args[++i];
      continue;
    }

    if (arg === "--header-value" && i + 1 < args.length) {
      parsed.headerValue = args[++i];
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!parsed.baseUrl) {
    throw new Error("Missing required --base-url");
  }

  if (Boolean(parsed.headerName) !== Boolean(parsed.headerValue)) {
    throw new Error(
      "Both --header-name and --header-value must be provided together",
    );
  }

  return parsed;
}

function buildDeployedSmokeHeaders(headerName, headerValue) {
  const headers = {
    "user-agent": "post-deploy-smoke",
  };

  if (headerName && headerValue) {
    headers[headerName] = headerValue;
  }

  return headers;
}

function isRetriableFetchError(error) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return true;
  }

  return (
    error instanceof Error &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause &&
    error.cause.code === "UND_ERR_CONNECT_TIMEOUT"
  );
}

async function requestDeployedSmoke(baseUrl, pathname, headers, retryEvents) {
  const url = new URL(pathname, baseUrl);

  let retries = 0;
  let lastError;

  for (let attempt = 0; attempt <= DEPLOY_SMOKE_REQUEST_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        headers,
        signal: AbortSignal.timeout(DEPLOY_SMOKE_REQUEST_TIMEOUT_MS),
      });
      const body = await response.text();

      if (response.status >= 500 && attempt < DEPLOY_SMOKE_REQUEST_RETRIES) {
        retries += 1;
        const nextAttempt = attempt + 2;
        retryEvents.push({
          pathname,
          reason: `status ${response.status}`,
          nextAttempt,
        });
        console.warn(
          `[post-deploy-smoke] ${pathname} returned ${response.status}; retrying attempt ${nextAttempt}/${DEPLOY_SMOKE_REQUEST_RETRIES + 1}`,
        );
        await delay(getDeploySmokeRetryDelayMs(attempt));
        continue;
      }

      return {
        pathname,
        status: response.status,
        location: response.headers.get("location"),
        body,
        retries,
      };
    } catch (error) {
      lastError = error;
      if (!isRetriableFetchError(error)) throw error;

      if (attempt < DEPLOY_SMOKE_REQUEST_RETRIES) {
        retries += 1;
        const nextAttempt = attempt + 2;
        retryEvents.push({
          pathname,
          reason: error instanceof Error ? error.message : String(error),
          nextAttempt,
        });
        console.warn(
          `[post-deploy-smoke] ${pathname} request failed; retrying attempt ${nextAttempt}/${DEPLOY_SMOKE_REQUEST_RETRIES + 1}`,
        );
        await delay(getDeploySmokeRetryDelayMs(attempt));
      }
    }
  }

  throw new Error("post-deploy-smoke retry loop exited without a response", {
    cause: lastError,
  });
}

async function runDeployedSmoke(args = []) {
  const { baseUrl, headerName, headerValue } = parseDeployedSmokeArgs(args);
  const headers = buildDeployedSmokeHeaders(headerName, headerValue);
  const failures = [];
  const retryEvents = [];

  console.log(`[post-deploy-smoke] Probing ${baseUrl}`);

  const rootResponse = await requestDeployedSmoke(
    baseUrl,
    "/",
    headers,
    retryEvents,
  );
  const invalidLocaleResponse = await requestDeployedSmoke(
    baseUrl,
    "/invalid/contact",
    headers,
    retryEvents,
  );
  const pages = [];

  for (const pathname of [
    "/en",
    "/zh",
    "/api/health",
    "/en/contact",
    "/zh/contact",
  ]) {
    pages.push(
      await requestDeployedSmoke(baseUrl, pathname, headers, retryEvents),
    );
  }

  pushFailureUnless(
    [200, 307, 308].includes(rootResponse.status),
    `Expected / to return 200/307/308, got ${rootResponse.status}`,
    failures,
  );

  if ([307, 308].includes(rootResponse.status)) {
    pushFailureUnless(
      rootResponse.location === "/en",
      `Expected / redirect location to be /en, got ${rootResponse.location ?? "(missing)"}`,
      failures,
    );
  }

  pushFailureUnless(
    [307, 308].includes(invalidLocaleResponse.status),
    `Expected /invalid/contact to redirect, got ${invalidLocaleResponse.status}`,
    failures,
  );
  pushFailureUnless(
    invalidLocaleResponse.location === "/en/contact",
    `Expected /invalid/contact redirect location to be /en/contact, got ${invalidLocaleResponse.location ?? "(missing)"}`,
    failures,
  );

  for (const response of pages) {
    pushFailureUnless(
      response.status === 200,
      `Expected ${response.pathname} to return 200, got ${response.status}`,
      failures,
    );
  }

  if (failures.length > 0) {
    console.error("[post-deploy-smoke] Failures detected:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    return false;
  }

  if (retryEvents.length > 0) {
    console.warn("[post-deploy-smoke] Retried probes:");
    for (const retry of retryEvents) {
      console.warn(
        `  - ${retry.pathname}: ${retry.reason}; next attempt ${retry.nextAttempt}/${DEPLOY_SMOKE_REQUEST_RETRIES + 1}`,
      );
    }
  }

  console.log("[post-deploy-smoke] All checks passed");
  return true;
}

function runChildCommand(command, args) {
  return spawnSync(command, args, {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
}

function extractCloudflarePreviewDeploymentUrls(output) {
  const urls = [];
  for (const match of output.matchAll(CF_PREVIEW_DEPLOY_URL_PATTERN)) {
    urls.push({
      worker: "native",
      url: match[0] ?? "",
    });
  }
  if (urls.length > 0) return urls;

  return [...new Set(output.match(CF_PREVIEW_URL_PATTERN) ?? [])].map(
    (url) => ({
      worker: "unknown",
      url,
    }),
  );
}

function chooseCloudflarePreviewGatewayUrl(urls) {
  const explicitGateway = urls.find((item) => item.worker === "native");
  if (explicitGateway) return explicitGateway.url;
  return urls.at(-1)?.url ?? null;
}

function writeCloudflarePreviewProofResult(result) {
  fs.mkdirSync(path.dirname(CF_PREVIEW_PROOF_OUTPUT_PATH), {
    recursive: true,
  });
  fs.writeFileSync(
    CF_PREVIEW_PROOF_OUTPUT_PATH,
    JSON.stringify(result, null, 2),
  );
}

function printCloudflarePreviewProofOutput(label, result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  console.log(
    `[proof:cf:preview-deployed] ${label} exit=${result.status ?? 1}`,
  );
}

function runCloudflarePreviewDeployedProof() {
  const deployResult = runChildCommand("pnpm", CF_PREVIEW_DEPLOY_COMMAND);
  const deployOutput = `${deployResult.stdout ?? ""}\n${deployResult.stderr ?? ""}`;
  printCloudflarePreviewProofOutput("deploy", deployResult);
  const deployCommand = `pnpm ${CF_PREVIEW_DEPLOY_COMMAND.join(" ")}`;

  if (/MISSING_MESSAGE/iu.test(deployOutput)) {
    const result = {
      status: "fail",
      stage: "deploy-log",
      generatedAt: new Date().toISOString(),
      command: deployCommand,
      reason: "next-intl MISSING_MESSAGE detected during preview proof",
    };
    writeCloudflarePreviewProofResult(result);
    console.log(JSON.stringify(result, null, 2));
    return 1;
  }

  if (deployResult.status !== 0) {
    const result = {
      status: "blocked",
      stage: "deploy",
      generatedAt: new Date().toISOString(),
      command: deployCommand,
      reason: "preview deploy failed or credentials are unavailable",
    };
    writeCloudflarePreviewProofResult(result);
    console.log(JSON.stringify(result, null, 2));
    return 2;
  }

  const urls = extractCloudflarePreviewDeploymentUrls(deployOutput);
  const baseUrl = chooseCloudflarePreviewGatewayUrl(urls);

  if (!baseUrl) {
    const result = {
      status: "blocked",
      stage: "deploy-output-parse",
      generatedAt: new Date().toISOString(),
      command: deployCommand,
      reason:
        "preview deploy completed but no workers.dev URL was found in output",
      discoveredUrls: urls,
    };
    writeCloudflarePreviewProofResult(result);
    console.log(JSON.stringify(result, null, 2));
    return 2;
  }

  const smokeArgs = [
    "scripts/starter-checks.js",
    "deployed-smoke",
    "--base-url",
    baseUrl,
  ];
  const smokeResult = runChildCommand("node", smokeArgs);
  printCloudflarePreviewProofOutput("smoke", smokeResult);

  const result = {
    status: smokeResult.status === 0 ? "pass" : "fail",
    stage: smokeResult.status === 0 ? "complete" : "smoke",
    generatedAt: new Date().toISOString(),
    baseUrl,
    discoveredUrls: urls,
    deployCommand,
    smokeCommand: `node ${smokeArgs.join(" ")}`,
  };
  writeCloudflarePreviewProofResult(result);
  console.log(JSON.stringify(result, null, 2));

  return smokeResult.status ?? 1;
}

module.exports = {
  runCloudflarePreviewDeployedProof,
  runCloudflarePreviewSmoke,
  runDeployedSmoke,
  runPublicPreviewSmoke,
};
