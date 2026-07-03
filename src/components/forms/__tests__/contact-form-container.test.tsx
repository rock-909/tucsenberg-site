import { act, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactFormContainer } from "@/components/forms/contact-form-container";
import { FORM_STATUS_CLASS_NAMES } from "@/components/forms/form-status-styles";
import type { UseContactFormResult } from "@/components/forms/use-contact-form";
import * as contactFormConfig from "@/config/contact-form-config";
import { fireEvent, render, screen } from "@/test/utils";

// 确保使用真实的Zod库和validations模块

// Mock fetch
global.fetch = vi.fn();

// Mock useActionState for React 19 testing
const mockUseActionState = vi.hoisted(() => vi.fn());
const mockUseContactForm = vi.hoisted(() => vi.fn());
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: mockUseActionState,
  };
});

vi.mock("@/components/forms/use-contact-form", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/forms/use-contact-form")
  >("@/components/forms/use-contact-form");

  return {
    ...actual,
    useContactForm: mockUseContactForm,
  };
});

// Mock next-intl with comprehensive translations
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    // Form fields
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    company: "Company",
    phone: "Phone",
    subject: "Subject",
    message: "Message",

    // Placeholders
    firstNamePlaceholder: "Enter your first name",
    lastNamePlaceholder: "Enter your last name",
    emailPlaceholder: "Enter your email",
    companyPlaceholder: "Enter your company",
    phonePlaceholder: "Enter your phone (optional)",
    subjectPlaceholder: "Enter subject (optional)",
    messagePlaceholder: "Enter your message",

    // Actions
    submit: "Submit",
    submitting: "Submitting...",

    // Status messages
    submitSuccess: "Form submitted successfully!",
    submitError: "Failed to submit form. Please try again.",
    networkError: "We could not submit the form. Please try again.",
    rateLimitMessage: "Please wait before submitting again.",
    CONTACT_SUBMISSION_EXPIRED:
      "This form expired. Please refresh the page and try again.",
    TURNSTILE_VERIFICATION_FAILED:
      "Security verification failed. Please try again.",

    // Checkboxes
    acceptPrivacy: "I accept the privacy policy",
    marketingConsent: "I agree to receive marketing communications",
  };

  const normalizedKey = key.split(".").pop() ?? key;
  return Object.prototype.hasOwnProperty.call(translations, normalizedKey)
    ? translations[normalizedKey]
    : key; // key 来自测试数据，安全
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

// Mock Turnstile component
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({
    onSuccess,
    onError,
    onExpire,
  }: {
    onSuccess?: (_token: string) => void;
    onError?: (_error: string) => void;
    onExpire?: () => void;
  }) => (
    <div data-testid="turnstile-mock">
      <button
        type="button"
        data-testid="turnstile-success"
        onClick={() => onSuccess?.("mock-token")}
      >
        Success
      </button>
      <button
        type="button"
        data-testid="turnstile-error"
        onClick={() => onError?.("test error")}
      >
        Error
      </button>
      <button
        type="button"
        data-testid="turnstile-expire"
        onClick={() => onExpire?.()}
      >
        Expire
      </button>
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock navigator.userAgent
Object.defineProperty(navigator, "userAgent", {
  value: "test-user-agent",
  writable: true,
});

// 通用表单填写函数
const validFormData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  company: "Test Company",
  phone: "+1234567890",
  subject: "Test Subject",
  message: "Test message content that is long enough to pass validation",
};

const _fillValidForm = async () => {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: validFormData.firstName },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: validFormData.lastName },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: validFormData.email },
    });
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: validFormData.company },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: validFormData.phone },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: validFormData.subject },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: validFormData.message },
    });

    // 勾选隐私政策
    const privacyCheckbox = screen.getByLabelText(/accept.*privacy/i);
    fireEvent.click(privacyCheckbox);

    // 启用 Turnstile
    fireEvent.click(screen.getByTestId("turnstile-success"));
  });
};

function expectSemanticStatusClasses(element: HTMLElement, classNames: string) {
  for (const className of classNames.split(" ")) {
    expect(element).toHaveClass(className);
  }
}

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

function mockContactForm(overrides: Partial<UseContactFormResult> = {}) {
  mockUseContactForm.mockReturnValue(createContactFormHook(overrides));
}

describe("ContactFormContainer - 剩余高级测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set default useActionState mock return value
    mockUseActionState.mockReturnValue([
      null, // state (idle)
      vi.fn(), // formAction
      false, // isPending
    ]);
    mockContactForm();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 注意：
  // - 基础渲染测试已移至 contact-form-container-core.test.tsx
  // - 验证逻辑测试已移至 contact-form-validation.test.tsx
  // - 提交和错误处理测试已移至 contact-form-submission.test.tsx

  describe("状态消息组件", () => {
    it("idle 状态不应该显示消息", () => {
      render(<ContactFormContainer />);

      // 不应该有状态消息
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("应该显示正确的状态消息样式", async () => {
      // Mock useActionState to return success state
      mockContactForm({
        state: { success: true, timestamp: "2026-05-05T00:00:00.000Z" },
        submitStatus: "success",
      });

      render(<ContactFormContainer />);

      // 检查成功消息 - 匹配mock翻译中定义的消息
      expect(
        screen.getByText("Form submitted successfully!"),
      ).toBeInTheDocument();

      // 检查消息样式 - success uses role="status" with aria-live="polite"
      const statusElement = screen.getByRole("status");
      expectSemanticStatusClasses(
        statusElement,
        FORM_STATUS_CLASS_NAMES.success,
      );
      expect(statusElement).toHaveAttribute("aria-live", "polite");
      expect(
        screen.getByTestId("contact-form-status-message"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("contact-form-status-message-text"),
      ).toHaveTextContent("Form submitted successfully!");
      expect(statusElement).toHaveTextContent("Form submitted successfully!");
      const successCheck = screen
        .getByTestId("contact-form-status-message")
        .querySelector('[data-slot="contact-success-check"]');
      expect(successCheck).toBeInTheDocument();
      expect(successCheck).toHaveAttribute("aria-hidden", "true");
      expect(within(statusElement).queryByRole("img")).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("未知 API 错误应该显示通用错误标题和错误样式", () => {
      mockContactForm({
        state: {
          success: false,
          errorCode: "UNKNOWN_ERROR",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      });

      render(<ContactFormContainer />);

      expect(
        screen.getByTestId("contact-form-error-heading"),
      ).toBeInTheDocument();
      expectSemanticStatusClasses(
        screen.getByTestId("contact-form-error-display"),
        FORM_STATUS_CLASS_NAMES.error,
      );
    });

    it("应该显示错误状态消息样式", async () => {
      // Mock useActionState to return error state
      mockContactForm({
        state: {
          success: false,
          error: "Server error",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      });

      render(<ContactFormContainer />);

      // 检查错误消息 - 匹配mock翻译中定义的消息
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();

      const statusMessage = screen.getByTestId("contact-form-status-message");
      expectSemanticStatusClasses(statusMessage, FORM_STATUS_CLASS_NAMES.error);
      expect(
        screen.getByTestId("contact-form-status-message-text"),
      ).toHaveTextContent("Failed to submit form. Please try again.");
      expect(
        statusMessage.querySelector('[data-slot="contact-success-check"]'),
      ).not.toBeInTheDocument();
    });
  });
});

describe("ContactFormContainer - 配置驱动", () => {
  const baseField = (
    overrides: Partial<contactFormConfig.ContactFormFieldDescriptor> = {},
  ): contactFormConfig.ContactFormFieldDescriptor => ({
    key: "email",
    enabled: true,
    required: true,
    type: "email",
    order: 1,
    i18nKey: "email",
    labelKey: "contact.form.email",
    placeholderKey: "contact.form.emailPlaceholder",
    isCheckbox: false,
    isHoneypot: false,
    ...overrides,
  });

  let builderSpy: any = null;

  afterEach(() => {
    builderSpy?.mockRestore();
    builderSpy = null;
  });

  beforeEach(() => {
    mockContactForm();
  });

  it("根据配置控制 required 与星号", () => {
    builderSpy = vi
      .spyOn(contactFormConfig, "buildFormFieldsFromConfig")
      .mockReturnValue([baseField({ required: false })]);

    render(<ContactFormContainer />);

    const emailLabel = screen.getByText("Email");
    expect(emailLabel.className).not.toContain("after:content-['*']");
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).not.toHaveAttribute("required");
  });

  it("字段禁用时不渲染", () => {
    builderSpy = vi
      .spyOn(contactFormConfig, "buildFormFieldsFromConfig")
      .mockReturnValue([baseField()]);

    render(<ContactFormContainer />);

    expect(screen.queryByLabelText(/accept.*privacy/i)).toBeNull();
  });
});

describe("ContactFormContainer - ErrorDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should display validation error details", () => {
    mockContactForm({
      state: {
        success: false,
        error: "Validation failed",
        details: ["errors.invalidEmail", "errors.messageTooShort"],
        timestamp: "2026-05-05T00:00:00.000Z",
      },
      submitStatus: "error",
    });

    render(<ContactFormContainer />);

    // Should show error container with details
    expect(
      screen.getByTestId("contact-form-error-display"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contact-form-error-heading"),
    ).toBeInTheDocument();
    expect(screen.getByText("errors.invalidEmail")).toBeInTheDocument();
    expect(screen.getByText("errors.messageTooShort")).toBeInTheDocument();
  });

  it("should not display raw error message for non-validation errors", () => {
    mockContactForm({
      state: {
        success: false,
        error: "Server connection failed",
        details: undefined,
        timestamp: "2026-05-05T00:00:00.000Z",
      },
      submitStatus: "error",
    });

    render(<ContactFormContainer />);

    expect(screen.queryByText("Server connection failed")).toBeNull();
    expect(screen.queryByTestId("contact-form-error-display")).toBeNull();
  });

  it("should translate network error codes", () => {
    mockContactForm({
      state: {
        success: false,
        errorCode: "FORM_NETWORK_ERROR",
        timestamp: "2026-05-05T00:00:00.000Z",
      },
      submitStatus: "error",
    });

    render(<ContactFormContainer />);

    expect(
      screen.getByText("We could not submit the form. Please try again."),
    ).toBeInTheDocument();
  });

  it("should not render raw english details for translated error-code paths", () => {
    mockContactForm({
      state: {
        success: false,
        errorCode: "CONTACT_SUBMISSION_EXPIRED",
        error: "Form submission expired or invalid",
        details: undefined,
        timestamp: "2026-05-05T00:00:00.000Z",
      },
      submitStatus: "error",
    });

    render(<ContactFormContainer />);

    expect(
      screen.getByText(
        "This form expired. Please refresh the page and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Form submission expired or invalid")).toBeNull();
  });

  it("should not display ErrorDisplay when no error", () => {
    mockContactForm({
      state: { success: true, timestamp: "2026-05-05T00:00:00.000Z" },
      submitStatus: "success",
    });

    render(<ContactFormContainer />);

    // Should not have error container
    expect(
      screen.queryByText("Server connection failed"),
    ).not.toBeInTheDocument();
  });
});

describe("ContactFormContainer - 提交状态计算", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show submitting status when isPending is true", () => {
    mockContactForm({
      isPending: true,
      submitStatus: "submitting",
    });

    render(<ContactFormContainer />);

    // Should show submitting message
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(
      screen.getByTestId("contact-form-status-message"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contact-form-submit-button"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("contact-form-submit-label")).toHaveTextContent(
      "Submit",
    );
  });

  it("should show idle status when no state changes", () => {
    mockContactForm();

    render(<ContactFormContainer />);

    // Should not show any status message
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
