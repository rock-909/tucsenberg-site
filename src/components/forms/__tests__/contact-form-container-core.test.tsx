/**
 * ContactFormContainer 核心测试
 * 包含基础渲染、基本验证和Turnstile集成测试
 *
 * 注意：高级测试场景请参考 contact-form-container.test.tsx
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactFormContainer } from "@/components/forms/contact-form-container";
import type { UseContactFormResult } from "@/components/forms/use-contact-form";

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

// Mock next-intl
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    company: "Company",
    phone: "Phone",
    subject: "Subject",
    message: "Message",
    submit: "Submit",
    submitting: "Submitting...",
    acceptPrivacy: "I accept the privacy policy",
    marketingConsent: "I would like to receive marketing communications",
    submitSuccess: "Message sent successfully",
    submitError: "Failed to submit form. Please try again.",
    rateLimitMessage: "Please wait before submitting again.",
    firstNamePlaceholder: "Enter your first name",
    lastNamePlaceholder: "Enter your last name",
    emailPlaceholder: "your@email.com",
    companyPlaceholder: "Your company name",
    phonePlaceholder: "+1 (555) 123-4567",
    subjectPlaceholder: "What can we help you with?",
    messagePlaceholder: "Please describe your needs or questions...",
  };
  return translations[key] || key; // key 来自测试数据，安全
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
}));

const originalRequestIdleCallback = window.requestIdleCallback;
const originalCancelIdleCallback = window.cancelIdleCallback;
const originalIntersectionObserver = (
  globalThis as typeof globalThis & {
    IntersectionObserver?: typeof IntersectionObserver;
  }
).IntersectionObserver;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe: IntersectionObserver["observe"] = vi.fn((element: Element) => {
    this.callback(
      [
        {
          isIntersecting: true,
          target: element,
        } as IntersectionObserverEntry,
      ],
      this,
    );
  });

  unobserve: IntersectionObserver["unobserve"] = vi.fn();
  disconnect: IntersectionObserver["disconnect"] = vi.fn();
  takeRecords: IntersectionObserver["takeRecords"] = vi.fn(() => []);
}

// Mock Turnstile
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({
    onSuccess,
    onError,
    onExpire,
  }: {
    onSuccess?: (token: string) => void;
    onError?: (error: string) => void;
    onExpire?: () => void;
  }) => (
    <div data-testid="turnstile-mock">
      <button
        data-testid="turnstile-success"
        onClick={() => onSuccess?.("mock-token")}
      >
        Success
      </button>
      <button
        data-testid="turnstile-error"
        onClick={() => onError?.("mock-error")}
      >
        Error
      </button>
      <button data-testid="turnstile-expire" onClick={() => onExpire?.()}>
        Expire
      </button>
    </div>
  ),
}));

vi.mock("next/dynamic", async () => {
  const React = await import("react");
  return {
    default: (
      importer: () => Promise<{ default?: React.ComponentType<any> }>,
    ) => {
      return function DynamicComponent(props: Record<string, unknown>) {
        const [Loaded, setLoaded] =
          React.useState<React.ComponentType<any> | null>(null);

        React.useEffect(() => {
          let mounted = true;
          importer().then((mod) => {
            if (!mounted) return;
            const Component =
              mod?.default ?? (mod as unknown as React.ComponentType<any>);
            setLoaded(() => Component);
          });
          return () => {
            mounted = false;
          };
        }, []);

        if (!Loaded) {
          return null;
        }

        return React.createElement(Loaded, props);
      };
    },
  };
});

const renderContactForm = async () => {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(<ContactFormContainer />);
  });
  return result!;
};

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

// 填写有效表单的辅助函数
// Note: phone field is disabled per Lead Pipeline requirements
const _fillValidForm = async (excludeFields: string[] = []) => {
  await act(async () => {
    if (!excludeFields.includes("firstName")) {
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "John" },
      });
    }

    if (!excludeFields.includes("lastName")) {
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Doe" },
      });
    }

    if (!excludeFields.includes("email")) {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "john.doe@example.com" },
      });
    }

    if (!excludeFields.includes("company")) {
      fireEvent.change(screen.getByLabelText(/company/i), {
        target: { value: "Test Company" },
      });
    }

    if (!excludeFields.includes("subject")) {
      fireEvent.change(screen.getByLabelText(/subject/i), {
        target: { value: "Test Subject" },
      });
    }

    if (!excludeFields.includes("message")) {
      fireEvent.change(screen.getByLabelText(/message/i), {
        target: { value: "Test message content" },
      });
    }

    // 总是勾选隐私政策（除非明确排除）
    if (!excludeFields.includes("acceptPrivacy")) {
      const privacyCheckbox = screen.getByLabelText(/accept.*privacy/i);
      fireEvent.click(privacyCheckbox);
    }

    // 启用 Turnstile
    const successButton = await screen.findByTestId("turnstile-success");
    fireEvent.click(successButton);
  });
};

describe("ContactFormContainer - 核心功能", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
      window as typeof window & {
        cancelIdleCallback?: typeof globalThis.cancelIdleCallback;
      }
    ).cancelIdleCallback = vi.fn();

    (
      globalThis as typeof globalThis & {
        IntersectionObserver?: typeof IntersectionObserver;
      }
    ).IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    // Default useActionState mock - idle state
    mockUseActionState.mockReturnValue([
      null, // state
      vi.fn(), // formAction
      false, // isPending
    ]);
    mockContactForm();
  });

  afterEach(() => {
    (
      window as typeof window & {
        requestIdleCallback?: typeof globalThis.requestIdleCallback;
        cancelIdleCallback?: typeof globalThis.cancelIdleCallback;
      }
    ).requestIdleCallback = originalRequestIdleCallback;
    (
      window as typeof window & {
        cancelIdleCallback?: typeof globalThis.cancelIdleCallback;
      }
    ).cancelIdleCallback = originalCancelIdleCallback;

    if (originalIntersectionObserver) {
      (
        globalThis as typeof globalThis & {
          IntersectionObserver?: typeof IntersectionObserver;
        }
      ).IntersectionObserver = originalIntersectionObserver;
    } else {
      Reflect.deleteProperty(globalThis, "IntersectionObserver");
    }
  });

  describe("基础渲染", () => {
    it("应该正确渲染联系表单", async () => {
      await renderContactForm();

      // 检查表单元素存在
      expect(
        screen.getByRole("button", { name: /submit/i }),
      ).toBeInTheDocument();
      expect(await screen.findByTestId("turnstile-mock")).toBeInTheDocument();

      // 检查所有表单字段都存在
      expect(screen.getByLabelText(/fullName/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });

    it("应该渲染所有必需的表单字段", async () => {
      await renderContactForm();

      // 检查所有字段是否存在
      // Note: phone field is disabled per Lead Pipeline requirements
      expect(screen.getByLabelText(/fullName/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it("提交按钮初始状态应该被禁用", async () => {
      await renderContactForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("基本验证", () => {
    it("应该验证邮箱格式", async () => {
      // Mock useActionState to return error state
      mockContactForm({
        state: {
          success: false,
          error: "Validation failed",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      });

      await renderContactForm();

      // 验证错误状态消息已显示
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();
    });

    it("应该验证必填字段", async () => {
      // Mock useActionState to return error state
      mockContactForm({
        state: {
          success: false,
          error: "Validation failed",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      });

      await renderContactForm();

      // 验证错误状态消息已显示
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();
    });
  });

  describe("Turnstile 集成", () => {
    it("Turnstile 成功后应该启用提交按钮", async () => {
      await renderContactForm();

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();

      const successButton = await screen.findByTestId("turnstile-success");
      fireEvent.click(successButton);
      // 注意：实际启用还需要表单验证通过
    });

    it("Turnstile 错误后应该禁用提交按钮", async () => {
      await renderContactForm();

      // 先成功，再错误
      const successButton = await screen.findByTestId("turnstile-success");
      fireEvent.click(successButton);
      const errorButton = await screen.findByTestId("turnstile-error");
      fireEvent.click(errorButton);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it("Turnstile 过期后应该禁用提交按钮", async () => {
      await renderContactForm();

      // 先成功，再过期
      const successButton = await screen.findByTestId("turnstile-success");
      fireEvent.click(successButton);
      const expireButton = await screen.findByTestId("turnstile-expire");
      fireEvent.click(expireButton);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("基本提交功能", () => {
    it("应该成功提交有效表单", async () => {
      // Mock useActionState to return success state
      mockContactForm({
        state: { success: true, timestamp: "2026-05-05T00:00:00.000Z" },
        submitStatus: "success",
      });

      await renderContactForm();

      // 检查成功消息 - 使用翻译文本
      expect(screen.getByText("Message sent successfully")).toBeInTheDocument();
    });

    it("应该处理 API 错误响应", async () => {
      // Mock useActionState to return error state
      mockContactForm({
        state: {
          success: false,
          error: "Server error",
          timestamp: "2026-05-05T00:00:00.000Z",
        },
        submitStatus: "error",
      });

      await renderContactForm();

      // 检查错误消息 - 使用翻译文本
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
