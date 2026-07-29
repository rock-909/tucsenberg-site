import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

/**
 * 原来两个 `it.each` 共 12 例：第一组六例断言完全相同的 data-slot（和上面那条重复），
 * 第二组六例是一张 token class 对照表，改 token 名就要同步改测试，而徽章长什么样
 * 它一条都证明不了。换成断言 variant 真的改变了产出的 class。
 *
 * 生产代码目前不渲染 Badge，只有 card.stories 和 color-directions.stories 在用；
 * DESIGN.md 保留了 badge-default 规格，所以组件留着，测试按实际价值收。
 */

describe("Badge", () => {
  it("renders a span carrying its label and any icon", () => {
    render(
      <Badge data-testid="badge">
        <svg aria-hidden="true" data-testid="badge-icon" />
        Ready
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveTextContent("Ready");
    expect(badge).toContainElement(screen.getByTestId("badge-icon"));
  });

  it("lets each semantic variant render differently", () => {
    const variants = [
      "default",
      "secondary",
      "success",
      "warning",
      "destructive",
      "outline",
    ] as const;

    const rendered = new Set(
      variants.map((variant) => {
        const { container, unmount } = render(
          <Badge variant={variant}>Variant</Badge>,
        );
        const className = container.firstElementChild?.className ?? "";
        unmount();
        return className;
      }),
    );

    expect(rendered.size).toBe(variants.length);
  });

  it("keeps a caller's className alongside its own", () => {
    render(
      <Badge className="custom-spacing" data-testid="badge">
        Active
      </Badge>,
    );

    const badge = screen.getByTestId("badge");
    expect(badge).toHaveClass("custom-spacing");
    expect(badge.className.split(" ").length).toBeGreaterThan(1);
  });
});
