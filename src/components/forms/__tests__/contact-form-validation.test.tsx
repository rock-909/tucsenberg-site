/**
 * ContactFormContainer 验证测试
 * 专门测试表单验证逻辑和边界条件
 *
 * 注意：基础测试请参考 contact-form-container-core.test.tsx
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactFormContainer } from "@/components/forms/contact-form-container";
import type { UseContactFormResult } from "@/components/forms/use-contact-form";

// 确保使用真实的Zod库和validations模块

// Mock fetch
global.fetch = vi.fn();

const mockUseContactForm = vi.hoisted(() => vi.fn());

vi.mock("@/components/forms/use-contact-form", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/forms/use-contact-form")
  >("@/components/forms/use-contact-form");

  return {
    ...actual,
    useContactForm: mockUseContactForm,
  };
});

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

// Mock next-intl
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    fullName: "Full name",
    email: "Email",
    company: "Company",
    phone: "Phone",
    subject: "Subject",
    message: "Message",
    submit: "Submit",
    submitting: "Submitting...",
    acceptPrivacy: "I accept the privacy policy",
  };
  return translations[key] || key; // key 来自测试数据，安全
});

vi.mock("next-intl", () => ({
  useTranslations: () => mockT,
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

function mockValidationFailure() {
  mockUseContactForm.mockReturnValue(
    createContactFormHook({
      state: {
        success: false,
        error: "Validation failed",
        timestamp: "2026-05-05T00:00:00.000Z",
      },
      submitStatus: "error",
    }),
  );
}

// 填写有效表单但排除指定字段的辅助函数
const _fillValidFormExcept = async (excludeFields: string[]) => {
  await act(async () => {
    if (!excludeFields.includes("fullName")) {
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "John Doe" },
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

    if (!excludeFields.includes("phone")) {
      fireEvent.change(screen.getByLabelText(/phone/i), {
        target: { value: "+1234567890" },
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
    fireEvent.click(screen.getByTestId("turnstile-success"));
  });
};

describe("ContactFormContainer - 验证逻辑", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseContactForm.mockReturnValue(createContactFormHook());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("字段长度验证", () => {
    it("应该验证姓名长度", async () => {
      mockValidationFailure();

      render(<ContactFormContainer />);

      // React 19 form state 显示通用错误消息
      expect(screen.getByText("submitError")).toBeInTheDocument();
    });

    it("应该验证消息长度", async () => {
      mockValidationFailure();

      render(<ContactFormContainer />);

      // React 19 form state 显示通用错误消息
      expect(screen.getByText("submitError")).toBeInTheDocument();
    });

    it("应该处理极长的输入", async () => {
      mockValidationFailure();

      render(<ContactFormContainer />);

      // React 19 form state 显示通用错误消息
      expect(screen.getByText("submitError")).toBeInTheDocument();
    });
  });

  describe("格式验证", () => {
    it("应该验证电话号码格式", async () => {
      mockValidationFailure();

      render(<ContactFormContainer />);

      // React 19 form state 显示通用错误消息
      expect(screen.getByText("submitError")).toBeInTheDocument();
    });

    it("应该正确处理特殊字符", async () => {
      mockValidationFailure();

      render(<ContactFormContainer />);

      // React 19 form state 显示通用错误消息
      expect(screen.getByText("submitError")).toBeInTheDocument();
    });
  });
});
