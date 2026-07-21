import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TurnstileWidget } from "@/components/security/turnstile";
import { captureExpectedConsoleErrors } from "@/test/console";
import { createTestInquiryFormCopy } from "@/test/inquiry-test-messages";

const defaultTestLabels = createTestInquiryFormCopy().turnstile;

const sentinelTurnstileLabels = {
  unavailable: "安全验证暂时不可用。",
  devBypass: "开发模式：Turnstile 验证已跳过",
  testMode: "测试模式下已关闭机器人防护",
  rescueBeforeEmail: "请改发邮件 —",
  rescueAfterEmail: "12 小时内回复。",
  rescueSubject: "报价咨询",
};

function toTurnstileWidgetLabels(
  labels: typeof defaultTestLabels,
): React.ComponentProps<typeof TurnstileWidget>["labels"] {
  return {
    unavailable: labels.unavailable,
    devBypass: labels.devBypass,
    testMode: labels.testMode,
    rescueBeforeEmail: labels.rescueBeforeEmail,
    rescueAfterEmail: labels.rescueAfterEmail,
    rescueSubject: labels.rescueSubject,
  };
}

function renderTurnstileWidget(
  props: React.ComponentProps<typeof TurnstileWidget> = {},
) {
  const { labels = toTurnstileWidgetLabels(defaultTestLabels), ...rest } =
    props;
  return render(
    <TurnstileWidget onSuccess={vi.fn()} labels={labels} {...rest} />,
  );
}

// 最早时机设置环境变量 - 在任何模块导入之前
vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key-12345");
vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "false");
vi.stubEnv("NODE_ENV", "test");

// 使用vi.hoisted创建Mock函数
const mockTurnstile = vi.hoisted(() =>
  vi.fn((props) =>
    React.createElement("div", {
      "data-testid": "turnstile-widget",
      "data-sitekey": props?.siteKey,
      "data-theme": props?.options?.theme,
      "data-size": props?.options?.size,
      className: `turnstile-container ${props?.className || ""}`.trim(),
      id: props?.id,
    }),
  ),
);

// Mock @marsidev/react-turnstile
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: mockTurnstile,
}));

// 获取Mock组件的引用
const getMockTurnstile = () => mockTurnstile;

describe("TurnstileWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key-12345");
    vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_BYPASS", "false");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.resetModules(); // 清除Node模块缓存，防止跨测试污染
  });

  describe("基础渲染", () => {
    it("应该正确渲染TurnstileWidget组件", () => {
      const { container } = renderTurnstileWidget();

      // 检查是否有任何内容被渲染
      expect(container.firstChild).not.toBeNull();

      // 应该渲染turnstile-widget
      expect(screen.getByTestId("turnstile-widget")).toBeInTheDocument();

      // 应该有turnstile-container类
      expect(
        container.querySelector(".turnstile-container"),
      ).toBeInTheDocument();
    });

    it("应该调用Turnstile组件", () => {
      renderTurnstileWidget();

      expect(getMockTurnstile()).toHaveBeenCalled();
    });

    it("应该传递正确的siteKey", () => {
      renderTurnstileWidget();

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        siteKey: "test-site-key-12345",
      });
    });

    it("uses INQUIRY_TURNSTILE_ACTION for the widget action", () => {
      renderTurnstileWidget();

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        options: {
          action: "product_inquiry",
        },
      });
    });
  });

  describe("组件配置", () => {
    it("应该处理自定义主题", () => {
      renderTurnstileWidget({ theme: "dark" });

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        options: {
          theme: "dark",
        },
      });
    });

    it("应该处理自定义尺寸", () => {
      renderTurnstileWidget({ size: "compact" });

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        options: {
          size: "compact",
        },
      });
    });

    it("应该处理自定义className", () => {
      renderTurnstileWidget({ className: "custom-class" });

      // className应该传递给外层容器，而不是内层的turnstile-widget
      const container = screen.getByTestId("turnstile-widget").parentElement;
      expect(container).toHaveClass("turnstile-container");
      expect(container).toHaveClass("custom-class");
    });

    it("应该处理自定义ID", () => {
      renderTurnstileWidget({ id: "custom-id" });

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        id: "custom-id",
      });
    });
  });

  describe("回调处理", () => {
    it("应该接受onError回调", () => {
      const onError = vi.fn();
      renderTurnstileWidget({ onError });

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        onError: expect.any(Function),
      });
    });

    it("应该接受onExpire回调", () => {
      const onExpire = vi.fn();
      renderTurnstileWidget({ onExpire });

      const mockCall = getMockTurnstile().mock.calls[0];
      expect(mockCall?.[0]).toMatchObject({
        onExpire: expect.any(Function),
      });
    });

    it("应该在成功时调用onSuccess回调", () => {
      const onSuccess = vi.fn();
      renderTurnstileWidget({ onSuccess });

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleSuccess = mockCall?.[0]?.onSuccess;
      handleSuccess?.("test-token-123");

      expect(onSuccess).toHaveBeenCalledWith("test-token-123");
    });

    it("应该在错误时调用onError回调", () => {
      const consoleError = captureExpectedConsoleErrors("Turnstile error:");
      const onError = vi.fn();
      renderTurnstileWidget({ onError });

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleError = mockCall?.[0]?.onError;
      handleError?.("test-error");

      expect(onError).toHaveBeenCalledWith("test-error");
      expect(consoleError).toHaveBeenCalledWith(
        "Turnstile error:",
        "test-error",
      );
    });

    it("应该在过期时调用onExpire回调", () => {
      const onExpire = vi.fn();
      renderTurnstileWidget({ onExpire });

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleExpire = mockCall?.[0]?.onExpire;
      handleExpire?.();

      expect(onExpire).toHaveBeenCalled();
    });

    it("应该在加载时调用onLoad回调", () => {
      const onLoad = vi.fn();
      renderTurnstileWidget({ onLoad });

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleLoad = mockCall?.[0]?.onLoad;
      handleLoad?.();

      expect(onLoad).toHaveBeenCalled();
    });

    it("应该处理没有onError回调的错误", () => {
      const consoleError = captureExpectedConsoleErrors("Turnstile error:");
      renderTurnstileWidget();

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleError = mockCall?.[0]?.onError;

      expect(() => handleError?.("test-error")).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith(
        "Turnstile error:",
        "test-error",
      );
    });

    it("应该处理没有onExpire回调的过期", () => {
      renderTurnstileWidget();

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleExpire = mockCall?.[0]?.onExpire;

      expect(() => handleExpire?.()).not.toThrow();
    });

    it("应该处理没有onLoad回调的加载", () => {
      renderTurnstileWidget();

      const mockCall = getMockTurnstile().mock.calls[0];
      const handleLoad = mockCall?.[0]?.onLoad;

      expect(() => handleLoad?.()).not.toThrow();
    });
  });

  describe("错误处理", () => {
    it("应该处理空的onSuccess回调", () => {
      expect(() => {
        render(
          <TurnstileWidget
            labels={toTurnstileWidgetLabels(defaultTestLabels)}
          />,
        );
      }).not.toThrow();
    });
  });

  describe("localized degraded-state labels", () => {
    const labels = sentinelTurnstileLabels;

    it("uses the provided unavailable label when the site key is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

      render(<TurnstileWidget labels={labels} />);

      expect(screen.getByRole("status")).toHaveTextContent(labels.unavailable);
    });

    it("uses passed rescue copy for the unavailable mailto subject", () => {
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");

      render(<TurnstileWidget labels={labels} />);

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `mailto:sales@tucsenberg.com?subject=${encodeURIComponent(labels.rescueSubject)}`,
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        labels.rescueBeforeEmail,
      );
      expect(screen.getByRole("status")).toHaveTextContent(
        labels.rescueAfterEmail,
      );
    });

    it("uses the provided test-mode label when the site key is missing", async () => {
      vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "true");
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
      const onSuccess = vi.fn();
      const onLoad = vi.fn();

      render(
        <TurnstileWidget
          labels={labels}
          onSuccess={onSuccess}
          onLoad={onLoad}
        />,
      );

      expect(screen.getByTestId("turnstile-mock")).toHaveTextContent(
        labels.testMode,
      );
      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith("XXXX.DUMMY.TOKEN.XXXX");
      });
      expect(onLoad).not.toHaveBeenCalled();
    });

    it("ignores public test mode in production and renders the real widget", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "true");
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "production-site-key");
      const onSuccess = vi.fn();

      render(<TurnstileWidget labels={labels} onSuccess={onSuccess} />);

      expect(screen.getByTestId("turnstile-widget")).toHaveAttribute(
        "data-sitekey",
        "production-site-key",
      );
      expect(screen.queryByTestId("turnstile-mock")).not.toBeInTheDocument();
      await vi.waitFor(() => {
        expect(onSuccess).not.toHaveBeenCalledWith("XXXX.DUMMY.TOKEN.XXXX");
      });
    });

    it.each([
      ["local", "local"],
      ["unknown", "unexpected"],
      ["missing", undefined],
    ])(
      "fails closed for a production build with a %s deploy label",
      async (_label, appEnv) => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("NEXT_PUBLIC_APP_ENV", appEnv);
        vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "true");
        vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "production-site-key");
        const onSuccess = vi.fn();

        render(<TurnstileWidget labels={labels} onSuccess={onSuccess} />);

        expect(screen.getByTestId("turnstile-widget")).toHaveAttribute(
          "data-sitekey",
          "production-site-key",
        );
        expect(screen.queryByTestId("turnstile-mock")).not.toBeInTheDocument();
        await vi.waitFor(() => {
          expect(onSuccess).not.toHaveBeenCalledWith("XXXX.DUMMY.TOKEN.XXXX");
        });
      },
    );

    it("keeps test mode available for a preview built with NODE_ENV production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview");
      vi.stubEnv("NEXT_PUBLIC_TEST_MODE", "true");
      const onSuccess = vi.fn();

      render(<TurnstileWidget labels={labels} onSuccess={onSuccess} />);

      expect(screen.getByTestId("turnstile-mock")).toHaveTextContent(
        labels.testMode,
      );
      await vi.waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith("XXXX.DUMMY.TOKEN.XXXX");
      });
    });

    it("uses the provided dev-bypass label", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("NEXT_PUBLIC_TURNSTILE_BYPASS", "true");

      render(<TurnstileWidget labels={labels} />);

      expect(screen.getByTestId("turnstile-bypass")).toHaveTextContent(
        labels.devBypass,
      );
    });
  });
});
