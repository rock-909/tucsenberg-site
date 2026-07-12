// Technical fallback rescue channel; the address also appears verbatim in the
// form error messages, so it stays a literal rather than a config import that
// would pull server env resolution into this client boundary.
const TURNSTILE_RESCUE_EMAIL = "sales@tucsenberg.com";

/**
 * The whole site funnels into one submit button; when verification is down,
 * the failure state must still offer a working channel instead of a dead end.
 */
export function TurnstileRescueLine() {
  return (
    <p className="mt-1 text-sm leading-6 text-muted-foreground">
      Email us instead —{" "}
      <a
        className="font-medium text-[var(--primary-text)] underline underline-offset-4 hover:no-underline"
        href={`mailto:${TURNSTILE_RESCUE_EMAIL}?subject=Quote%20request`}
      >
        {TURNSTILE_RESCUE_EMAIL}
      </a>
      . Same 12-hour quote commitment.
    </p>
  );
}
