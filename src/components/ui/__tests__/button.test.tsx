import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

/**
 * 原来 27 条里有 19 条在逐个断言 Tailwind class 字符串：每个 variant 一条、每个
 * size 一条、focus/disabled/svg 的 class 各一条。改一个 token 名就要同步改测试，
 * 而按钮长什么样它一条都证明不了。
 *
 * 这里换成断言「variant 和 size 真的改变了产出的 class」而不是断言具体是哪些
 * class——cva 接线掉了会红，换 token 名不会。
 *
 * 另外原来 mock 掉了 `@radix-ui/react-slot`，所以 asChild 那条测的是 mock 自己的
 * cloneElement。现在用真 Slot：产品页 CTA 就是靠这条路径把按钮样式套到链接上的。
 */

describe("Button", () => {
  it("renders a button carrying its label", () => {
    render(<Button>Request a Quote</Button>);

    const button = screen.getByRole("button", { name: "Request a Quote" });
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("calls its handler when clicked", () => {
    const submitInquiry = vi.fn();
    render(<Button onClick={submitInquiry}>Send</Button>);

    fireEvent.click(screen.getByRole("button"));

    expect(submitInquiry).toHaveBeenCalledTimes(1);
  });

  it("swallows clicks while disabled", () => {
    const submitInquiry = vi.fn();
    render(
      <Button onClick={submitInquiry} disabled>
        Send
      </Button>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(submitInquiry).not.toHaveBeenCalled();
  });

  // 产品页 CTA 走的就是这条：Slot 把按钮的 class 和 data-slot 合并到子链接上，
  // 渲染出来的必须还是一个 link，不能变成嵌在按钮里的链接。
  it("hands its styling to the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/request-quote">Request a Quote</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Request a Quote" });
    expect(link).toHaveAttribute("href", "/request-quote");
    expect(link).toHaveAttribute("data-slot", "button");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets variant and size change what gets rendered", () => {
    const { rerender } = render(<Button>Default</Button>);
    const defaultClasses = screen.getByRole("button").className;

    rerender(<Button variant="outline">Outline</Button>);
    const outlineClasses = screen.getByRole("button").className;

    rerender(<Button size="lg">Large</Button>);
    const largeClasses = screen.getByRole("button").className;

    expect(outlineClasses).not.toBe(defaultClasses);
    expect(largeClasses).not.toBe(defaultClasses);
  });

  it("keeps a caller's className alongside its own", () => {
    render(<Button className="mt-6">Spaced</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("mt-6");
    expect(button.className.split(" ").length).toBeGreaterThan(1);
  });
});
