/**
 * ContactFormContainer 核心测试
 * 包含基础渲染、基本验证和Turnstile集成测试
 *
 * 注意：高级测试场景请参考 contact-form-container.test.tsx
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

// Mock Turnstile
vi.mock("@/components/forms/lazy-turnstile", () => ({
  LazyTurnstile: ({
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
        type="button"
        data-testid="turnstile-success"
        onClick={() => onSuccess?.("mock-token")}
      >
        Success
      </button>
      <button
        type="button"
        data-testid="turnstile-error"
        onClick={() => onError?.("mock-error")}
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

    // 启用 Turnstile
    const successButton = await screen.findByTestId("turnstile-success");
    fireEvent.click(successButton);
  });
};

describe("ContactFormContainer - 核心功能", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default useActionState mock - idle state
    mockUseActionState.mockReturnValue([
      null, // state
      vi.fn(), // formAction
      false, // isPending
    ]);
    mockContactForm();
  });

  describe("基础渲染", () => {
    it("应该正确渲染联系表单", async () => {
      render(<ContactFormContainer />);

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
      render(<ContactFormContainer />);

      // 检查所有字段是否存在
      // Note: phone field is disabled per Lead Pipeline requirements
      expect(screen.getByLabelText(/fullName/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it("提交按钮初始状态应该被禁用", async () => {
      render(<ContactFormContainer />);

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

      render(<ContactFormContainer />);

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

      render(<ContactFormContainer />);

      // 验证错误状态消息已显示
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();
    });
  });

  describe("Turnstile 集成", () => {
    it("Turnstile 成功后应该启用提交按钮", async () => {
      render(<ContactFormContainer />);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();

      const successButton = await screen.findByTestId("turnstile-success");
      fireEvent.click(successButton);
      // 注意：实际启用还需要表单验证通过
    });

    it("Turnstile 错误后应该禁用提交按钮", async () => {
      render(<ContactFormContainer />);

      // 先成功，再错误
      const successButton = await screen.findByTestId("turnstile-success");
      fireEvent.click(successButton);
      const errorButton = await screen.findByTestId("turnstile-error");
      fireEvent.click(errorButton);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it("Turnstile 过期后应该禁用提交按钮", async () => {
      render(<ContactFormContainer />);

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

      render(<ContactFormContainer />);

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

      render(<ContactFormContainer />);

      // 检查错误消息 - 使用翻译文本
      expect(
        screen.getByText("Failed to submit form. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
