import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactFormContainer } from "@/components/forms/contact-form-container";
import { FormFields } from "@/components/forms/contact-form-fields";
import type { UseContactFormResult } from "@/components/forms/use-contact-form";

const mockUseContactForm = vi.hoisted(() => vi.fn());
const mockUseRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/components/forms/use-contact-form", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/forms/use-contact-form")
  >("@/components/forms/use-contact-form");

  return {
    ...actual,
    useContactForm: mockUseContactForm,
  };
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      fullName: "Full name",
      email: "Email",
      company: "Company",
      subject: "Subject",
      message: "Message",
      submit: "Submit",
      submitting: "Submitting...",
      turnstilePending:
        "Security verification is loading. You can send the form once it is ready.",
      turnstileFailed:
        "Security verification did not complete. Please try again.",
      turnstileExpired:
        "Security verification expired. Please complete it again.",
      submitError: "Failed to submit form. Please try again.",
      fullNamePlaceholder: "Enter your full name",
      emailPlaceholder: "Enter your email",
      companyPlaceholder: "Enter your company",
      subjectPlaceholder: "Enter your subject",
      messagePlaceholder: "Enter your message",
      error: "There was a problem",
      CONTACT_SUBMISSION_EXPIRED:
        "This form expired. Please refresh the page and try again.",
    };

    return translations[key] ?? key;
  },
}));

vi.mock("@/components/forms/use-rate-limit", () => ({
  useRateLimit: mockUseRateLimit,
}));

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess?: (_token: string) => void }) => (
    <button
      type="button"
      data-testid="turnstile-success"
      onClick={() => onSuccess?.("mock-token")}
    >
      Turnstile Success
    </button>
  ),
}));

function createContactFormHook(
  overrides: Partial<UseContactFormResult> = {},
): UseContactFormResult {
  return {
    state: null,
    formAction: vi.fn(async () => {}),
    isPending: false,
    submitStatus: "idle",
    turnstileToken: "",
    setTurnstileToken: vi.fn(),
    turnstileStatus: "loading",
    setTurnstileStatus: vi.fn(),
    isRateLimited: false,
    ...overrides,
  };
}

describe("ContactFormContainer accessibility", () => {
  beforeEach(() => {
    mockUseContactForm.mockReturnValue(createContactFormHook());
    mockUseRateLimit.mockReturnValue({
      isRateLimited: false,
      lastSubmissionTime: null,
      recordSubmission: vi.fn(),
      setLastSubmissionTime: vi.fn(),
    });

    (
      window as typeof window & {
        requestIdleCallback?: typeof globalThis.requestIdleCallback;
        cancelIdleCallback?: typeof globalThis.cancelIdleCallback;
      }
    ).requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({
        didTimeout: false,
        timeRemaining: () => 1,
      });
      return 1 as unknown as number;
    });

    (
      globalThis as typeof globalThis & {
        IntersectionObserver?: typeof IntersectionObserver;
      }
    ).IntersectionObserver = class {
      observe = vi.fn((element: Element) => {
        this.callback(
          [
            {
              isIntersecting: true,
              target: element,
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver,
        );
      });
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);

      constructor(private readonly callback: IntersectionObserverCallback) {}
    } as unknown as typeof IntersectionObserver;
  });

  it("adds useful autocomplete and input hints to contact fields", async () => {
    render(<ContactFormContainer />);

    await screen.findByTestId("turnstile-success");

    expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
      "autocomplete",
      "name",
    );
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      "inputmode",
      "email",
    );
    expect(screen.getByLabelText(/company/i)).toHaveAttribute(
      "autocomplete",
      "organization",
    );
    expect(screen.getByLabelText(/subject/i)).toHaveAttribute(
      "autocomplete",
      "off",
    );
    expect(screen.getByLabelText(/message/i)).toHaveAttribute(
      "autocomplete",
      "off",
    );
  });

  it("renders the Contact form inside the Radix Themes pilot boundary", async () => {
    render(<ContactFormContainer />);

    await screen.findByTestId("turnstile-success");

    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
    expect(screen.getByTestId("contact-form-shell")).toBeInTheDocument();
  });

  it("focuses the error summary when the server returns a submission error", async () => {
    mockUseContactForm.mockReturnValue(
      createContactFormHook({
        state: {
          success: false,
          errorCode: "CONTACT_SUBMISSION_EXPIRED",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      }),
    );

    await act(async () => {
      render(<ContactFormContainer />);
    });

    const alert = screen.getByTestId("contact-form-error-display");
    expect(alert).toHaveFocus();
  });

  it("keeps the honeypot serialized without exposing it as a visible text control", () => {
    const { container } = render(
      <form>
        <FormFields t={(key) => key} isPending={false} />
      </form>,
    );

    const form = container.querySelector("form");
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="website"]',
    );

    if (!form || !honeypot) {
      throw new Error("Expected the form and website honeypot to render.");
    }

    expect(honeypot).toHaveAttribute("id", "website");
    expect(honeypot).toHaveAttribute("type", "hidden");
    expect(honeypot).toHaveAttribute("hidden");
    expect(honeypot).not.toHaveClass("sr-only");
    expect(
      screen.queryByRole("textbox", { name: /website/i }),
    ).not.toBeInTheDocument();

    honeypot.value = "bot-filled";
    expect(new FormData(form).get("website")).toBe("bot-filled");
  });

  it("explains why submit is disabled while security verification is pending", async () => {
    render(<ContactFormContainer />);

    await screen.findByTestId("turnstile-success");

    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    expect(
      screen.getByText(
        "Security verification is loading. You can send the form once it is ready.",
      ),
    ).toBeInTheDocument();
  });
});
