import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactFormContainer } from "@/components/forms/contact-form-container";

const mockUseRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/components/forms/use-rate-limit", () => ({
  useRateLimit: mockUseRateLimit,
}));

vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({
    onSuccess,
    onError,
    onExpire,
    onLoad,
  }: {
    onSuccess?: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    onLoad?: () => void;
  }) => (
    <div data-testid="turnstile-mock">
      <button
        data-testid="turnstile-load"
        onClick={() => onLoad?.()}
        type="button"
      >
        Load verification
      </button>
      <button
        data-testid="turnstile-success"
        onClick={() => onSuccess?.("mock-turnstile-token")}
        type="button"
      >
        Complete verification
      </button>
      <button
        data-testid="turnstile-error"
        onClick={() => onError?.()}
        type="button"
      >
        Fail verification
      </button>
      <button
        data-testid="turnstile-expire"
        onClick={() => onExpire?.()}
        type="button"
      >
        Expire verification
      </button>
    </div>
  ),
}));

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    fullName: "Full name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    company: "Company",
    companyPlaceholder: "Company name",
    phone: "Phone",
    phonePlaceholder: "Phone number",
    subject: "Subject",
    subjectPlaceholder: "Project subject",
    message: "Message",
    messagePlaceholder: "Tell us what you need",
    optional: "Optional",
    submit: "Submit",
    submitting: "Submitting...",
    submitSuccess: "Message sent successfully",
    submitError: "Failed to submit form. Please try again.",
    turnstilePending:
      "Security verification is loading. You can send the form once it is ready.",
    turnstileFailed:
      "Security verification did not complete. Please try again.",
    turnstileExpired:
      "Security verification expired. Please complete it again.",
    rateLimitMessage: "Please wait before submitting again.",
    securityVerificationUnavailable:
      "Security verification is temporarily unavailable.",
    turnstileLoadFailed: "Security verification failed to load.",
    turnstileDevBypass: "Dev mode: Turnstile verification bypassed",
    turnstileTestMode: "Bot protection disabled in test mode",
  };

  return translations[key] ?? key;
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

async function renderReadyContactForm() {
  render(<ContactFormContainer />);
  await screen.findByTestId("turnstile-mock");
}

async function completeTurnstile() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("turnstile-success"));
  });
}

function getFetchBody(): Record<string, unknown> {
  const requestInit = vi.mocked(fetch).mock.calls[0]?.[1];
  expect(requestInit).toBeDefined();
  return JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
}

describe("ContactFormContainer real form wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRateLimit.mockReturnValue({
      isRateLimited: false,
      setLastSubmissionTime: vi.fn(),
    });

    global.fetch = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          referenceId: "contact-ref-001",
        },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits real user-entered fields through useContactForm to /api/contact", async () => {
    await renderReadyContactForm();
    await completeTurnstile();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Alice Example" },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: "Example Co." },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Custom project" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "We need help scoping a replacement website project." },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });

    expect(getFetchBody()).toMatchObject({
      fullName: "Alice Example",
      email: "alice@example.com",
      company: "Example Co.",
      subject: "Custom project",
      message: "We need help scoping a replacement website project.",
      website: "",
      turnstileToken: "mock-turnstile-token",
      submittedAt: expect.any(String),
    });
  });

  it("updates security verification copy when Turnstile succeeds, fails, and expires", async () => {
    await renderReadyContactForm();

    const pendingCopy =
      "Security verification is loading. You can send the form once it is ready.";
    const failedCopy =
      "Security verification did not complete. Please try again.";
    const expiredCopy =
      "Security verification expired. Please complete it again.";

    expect(screen.getByText(pendingCopy)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    await completeTurnstile();

    expect(screen.queryByText(pendingCopy)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByTestId("turnstile-error"));
    });

    // The widget owns the error state (unavailable + email rescue); the form
    // must not stack its own contradictory "please try again" line on top.
    expect(screen.queryByText(failedCopy)).not.toBeInTheDocument();
    expect(screen.queryByText(pendingCopy)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    await completeTurnstile();

    await act(async () => {
      fireEvent.click(screen.getByTestId("turnstile-expire"));
    });

    expect(screen.getByText(expiredCopy)).toBeInTheDocument();
    expect(screen.queryByText(pendingCopy)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
