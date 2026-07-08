import { INPUT_VALIDATION_CONSTANTS } from "@/constants/security-constants";

/**
 * 安全验证工具
 * Security validation utilities
 */

/**
 * Security constants for validation
 */
const VALIDATION_CONSTANTS = {
  // Email validation
  MAX_EMAIL_LENGTH: INPUT_VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH,
} as const;

interface UnsafeTagScan {
  readonly input: string;
  readonly lower: string;
  readonly tag: "script" | "iframe";
}

interface UnsafeTagState {
  readonly current: number;
  readonly depth: number;
  readonly quote: '"' | "'" | "`" | null;
}

function isTagBoundary(input: string, boundaryIndex: number): boolean {
  const character = input[boundaryIndex];
  return (
    character === undefined ||
    character === ">" ||
    character === "/" ||
    /\s/u.test(character)
  );
}

function findTagEnd(input: string, start: number): number {
  for (let current = start; current < input.length; current += 1) {
    if (input[current] === ">") {
      return current + 1;
    }
  }
  return input.length;
}

function isOpeningTagAt(
  input: string,
  start: number,
  tag: "script" | "iframe",
): boolean {
  return (
    input.startsWith(`<${tag}`, start) &&
    isTagBoundary(input, start + tag.length + 1)
  );
}

function isClosingTagAt(
  input: string,
  start: number,
  tag: "script" | "iframe",
): boolean {
  return (
    input.startsWith(`</${tag}`, start) &&
    isTagBoundary(input, start + tag.length + 2)
  );
}

function updateQuoteState(
  quote: '"' | "'" | "`" | null,
  character: string | undefined,
  previousCharacter: string | undefined,
): '"' | "'" | "`" | null {
  if (
    (character === '"' || character === "'" || character === "`") &&
    previousCharacter !== "\\"
  ) {
    return quote === character ? null : (quote ?? character);
  }

  return quote;
}

function scanUnsafeTagStep(
  scan: UnsafeTagScan,
  state: UnsafeTagState,
): UnsafeTagState {
  const { input, lower, tag } = scan;
  const { current, depth, quote } = state;
  const character = input[current];
  const previousCharacter = current > 0 ? input[current - 1] : undefined;
  const nextQuote = updateQuoteState(quote, character, previousCharacter);

  if (nextQuote !== quote) {
    return { current: current + 1, depth, quote: nextQuote };
  }

  if (quote === null && isOpeningTagAt(lower, current, tag)) {
    return {
      current: findTagEnd(input, current),
      depth: depth + 1,
      quote,
    };
  }

  if (quote === null && isClosingTagAt(lower, current, tag)) {
    return {
      current: findTagEnd(input, current),
      depth: depth - 1,
      quote,
    };
  }

  return { current: current + 1, depth, quote };
}

function findUnsafeTagEnd(scan: UnsafeTagScan, start: number): number {
  const { input } = scan;
  let state: UnsafeTagState = {
    current: findTagEnd(input, start),
    depth: 1,
    quote: null,
  };

  while (state.current < input.length) {
    state = scanUnsafeTagStep(scan, state);
    if (state.depth === 0) return state.current;
  }

  return input.length;
}

function stripUnsafeTag(input: string, tag: "script" | "iframe"): string {
  const lower = input.toLowerCase();
  const scan = { input, lower, tag };
  const out: string[] = [];
  let current = 0;

  while (current < input.length) {
    if (isOpeningTagAt(lower, current, tag)) {
      current = findUnsafeTagEnd(scan, current);
      continue;
    }

    out.push(input[current] ?? "");
    current += 1;
  }

  return out.join("");
}

/**
 * Sanitize plain text input for general use
 * Removes XSS vectors while preserving safe text content
 *
 * Use this for: names, messages, company names, requirements, etc.
 */
export function sanitizePlainText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Sanitize URL input
 * Validates protocol and removes dangerous patterns
 *
 * Use this for: website URLs, redirect targets, external links
 *
 * @param url - URL string to sanitize
 * @param allowedProtocols - Protocols to allow (default: http, https)
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(
  url: string,
  allowedProtocols: readonly string[] = ["http:", "https:"],
): string {
  if (typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // Empty string is valid (optional URL fields)
  if (!trimmed) {
    return "";
  }

  try {
    const urlObj = new URL(trimmed);

    // Check protocol is allowed
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return "";
    }

    // Remove javascript: in any part
    if (/javascript:/i.test(trimmed)) {
      return "";
    }

    return trimmed;
  } catch {
    // Not a valid URL - return empty
    return "";
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (
    emailRegex.test(email) &&
    email.length <= VALIDATION_CONSTANTS.MAX_EMAIL_LENGTH
  );
}

/**
 * Validate URL format and protocol
 */
export function isValidUrl(
  url: string,
  allowedProtocols: string[] = ["http:", "https:"],
): boolean {
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize file path to prevent path traversal attacks
 */
export function sanitizeFilePath(filePath: string): string {
  if (typeof filePath !== "string") {
    return "";
  }

  // Remove dangerous path components
  return filePath
    .replace(/\.\./g, "") // Remove parent directory references
    .replace(/[<>:"|?*]/g, "") // Remove invalid filename characters
    .replace(/^\/+/, "") // Remove leading slashes
    .trim();
}

/**
 * Validate input length
 */
export function validateInputLength(
  input: string,
  minLength: number = 0,
  maxLength: number = INPUT_VALIDATION_CONSTANTS.TEXT_MAX_LENGTH,
): { valid: boolean; error?: string } {
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  if (input.length < minLength) {
    return {
      valid: false,
      error: `Input must be at least ${minLength} characters`,
    };
  }

  if (input.length > maxLength) {
    return {
      valid: false,
      error: `Input must be no more than ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Check if string contains only allowed characters
 */
export function validateCharacters(
  input: string,
  allowedPattern: RegExp,
): { valid: boolean; error?: string } {
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  if (!allowedPattern.test(input)) {
    return { valid: false, error: "Input contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // International phone number validation
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate and sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== "string") {
    return "";
  }

  let sanitized = stripUnsafeTag(html, "script");
  sanitized = stripUnsafeTag(sanitized, "iframe");
  sanitized = sanitized
    .replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "") // 移除事件处理属性
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .trim();
  return sanitized;
}

/**
 * Validate JSON string
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}
