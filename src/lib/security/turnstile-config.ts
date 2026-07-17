import { env, getRuntimeEnvString } from "@/lib/env";
import { SITE_CONFIG } from "@/config/paths/site-config";
import { logger } from "@/lib/logger";

/**
 * Parse the configured Turnstile allowed hostnames.
 */
function parseConfiguredHosts(): string[] {
  const hosts =
    getRuntimeEnvString("TURNSTILE_ALLOWED_HOSTS") ??
    env.TURNSTILE_ALLOWED_HOSTS;
  if (!hosts) return [];

  return hosts.split(",").flatMap((value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized ? [normalized] : [];
  });
}

/**
 * Derive sensible fallback hostnames when TURNSTILE_ALLOWED_HOSTS is not set.
 */
function deriveFallbackHosts(): string[] {
  const hosts = new Set<string>();
  const baseUrl = SITE_CONFIG.baseUrl?.trim() ?? "";

  if (baseUrl !== "") {
    try {
      hosts.add(new URL(baseUrl).hostname.toLowerCase());
    } catch (error) {
      logger.warn(
        "Failed to parse site base URL for Turnstile host validation",
        {
          baseUrl,
          error,
        },
      );
    }
  }

  hosts.add("localhost");

  return Array.from(hosts);
}

function getAllowedTurnstileHostsFromConfig(): string[] {
  const configured = parseConfiguredHosts();
  return configured.length > 0 ? configured : deriveFallbackHosts();
}

function getAllowedTurnstileHostsSet(): Set<string> {
  return new Set(getAllowedTurnstileHostsFromConfig());
}

/**
 * Return the list of hostnames that are allowed to appear in Turnstile verification responses.
 */
export function getAllowedTurnstileHosts(): string[] {
  return getAllowedTurnstileHostsFromConfig();
}

/**
 * Check whether the verification response originates from an allowed hostname.
 */
export function isAllowedTurnstileHostname(hostname?: string | null): boolean {
  if (!hostname) return false;

  const normalized = hostname.toLowerCase();
  return getAllowedTurnstileHostsSet().has(normalized);
}

/**
 * Default allowed actions for Turnstile verification.
 * Can be extended via TURNSTILE_ALLOWED_ACTIONS env variable (comma-separated).
 */
const DEFAULT_ALLOWED_ACTIONS = ["contact_form", "product_inquiry"] as const;
const DEFAULT_ALLOWED_ACTIONS_SET = new Set<string>(DEFAULT_ALLOWED_ACTIONS);

function parseConfiguredActions(): string[] {
  const configuredActions =
    getRuntimeEnvString("TURNSTILE_ALLOWED_ACTIONS") ??
    env.TURNSTILE_ALLOWED_ACTIONS;
  if (!configuredActions) {
    return [];
  }

  return configuredActions.split(",").flatMap((value) => {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  });
}

function getAllowedTurnstileActionsSet(): Set<string> {
  const configured = parseConfiguredActions();
  return configured.length > 0
    ? new Set(configured)
    : DEFAULT_ALLOWED_ACTIONS_SET;
}

/**
 * Return the expected Turnstile action identifier (primary action).
 */
export function getExpectedTurnstileAction(): string {
  const configured =
    (
      getRuntimeEnvString("TURNSTILE_EXPECTED_ACTION") ??
      env.TURNSTILE_EXPECTED_ACTION
    )?.trim() ?? "";
  return configured === "" ? "contact_form" : configured;
}

/**
 * Determine whether the verification response action matches expectations.
 * Supports multiple allowed actions for different form types.
 */
export function isAllowedTurnstileAction(action?: string | null): boolean {
  if (typeof action !== "string") {
    return false;
  }

  return getAllowedTurnstileActionsSet().has(action.trim());
}
