const TURNSTILE_SERVICE_FAILURE_CODES = new Set([
  "not-configured",
  "network-error",
  "timeout",
]);

export function isTurnstileServiceFailureCode(code: string): boolean {
  return TURNSTILE_SERVICE_FAILURE_CODES.has(code);
}

export function hasTurnstileServiceFailure(codes: readonly string[]): boolean {
  return codes.some(isTurnstileServiceFailureCode);
}
