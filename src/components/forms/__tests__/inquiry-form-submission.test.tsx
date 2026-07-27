import { act, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFormControls,
  renderInquiryForm,
} from "@/test/inquiry-form-harness";
import { turnstileWidgetResetSpy } from "@/test/inquiry-turnstile-mock";

vi.mock(
  "@/components/forms/lazy-turnstile",
  async () => await import("@/test/inquiry-turnstile-mock"),
);

/**
 * 提交生命周期的行为证明：提交锁、令牌一次性、widget 重置、网络异常降级。
 *
 * 这些以前由一个共用提交 hook 的测试守着，测的是那个 hook 的内部状态机；逻辑
 * 内联回表单后，守的是买家真正看得见的东西。
 * 字段契约与错误文案在 `inquiry-form.test.tsx`，装备两边共用。
 */

function successResponse() {
  return Response.json({ success: true, data: { referenceId: "inq-ref-1" } });
}

function fillRequiredFields(container: HTMLElement) {
  const controls = getFormControls(container);
  fireEvent.click(screen.getByTestId("inquiry-turnstile-success"));
  fireEvent.change(controls.fullName, { target: { value: "Ada Buyer" } });
  fireEvent.change(controls.email, { target: { value: "ada@example.com" } });
  return controls;
}

describe("InquiryForm submission lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    global.fetch = vi.fn(async () => successResponse());
  });

  it("locks the submit button while the request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { container, copy } = renderInquiryForm("contact");
    const { form } = fillRequiredFields(container);
    const submit = within(form).getByRole("button", { name: copy.submit });

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(submit).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);

    // 按钮禁用不等于关门：回车仍然能提交。不锁住的话买家连点两下，
    // 业主收到两条一模一样的询盘。
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch(successResponse());
    });
    await screen.findByText(
      `${copy.success} ${copy.referenceLabel}: inq-ref-1`,
    );
  });

  it("requires a fresh Turnstile token for the next submit", async () => {
    const { container, copy } = renderInquiryForm("contact");
    const { form } = fillRequiredFields(container);

    await act(async () => {
      fireEvent.submit(form);
    });
    await screen.findByText(
      `${copy.success} ${copy.referenceLabel}: inq-ref-1`,
    );

    // 令牌是一次性的。提交落定后不清掉，第二次提交会带着废令牌被服务端拒，
    // 买家看到的是一条无从下手的安全错误。
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(copy.errors.securitySummary)).toBeInTheDocument();
  });

  it("resets the Turnstile widget after a failed submit", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, errorCode: "RATE_LIMIT_EXCEEDED" }),
        { status: 429 },
      ),
    );

    const { container, copy } = renderInquiryForm("contact");
    const { form } = fillRequiredFields(container);

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText(copy.errors.serverSummary)).toBeVisible();
    // 不让 widget 重新出题，买家就再也拿不到令牌，提交按钮永远禁用。
    expect(turnstileWidgetResetSpy).toHaveBeenCalledTimes(1);
  });

  it("shows a server error when the network request throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { container, copy } = renderInquiryForm("contact");
    const { form, fullName, email } = fillRequiredFields(container);

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText(copy.errors.serverSummary)).toBeVisible();
    // 断网不该顺手清空表单：买家重试时不用把字重打一遍。
    expect(fullName).toHaveValue("Ada Buyer");
    expect(email).toHaveValue("ada@example.com");
  });
});
