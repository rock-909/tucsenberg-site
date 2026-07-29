import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { badgeVariants } from "@/components/ui/badge-variants";

/**
 * 原来两个 `it.each` 共 12 例：第一组六例断言完全相同的 data-slot（和上面那条重复），
 * 第二组六例逐个复述完整的 class 串。留下一张语义映射表，每个 variant 只钉它那一档
 * 的 token——守的是「success 和 destructive 被对调」这种故障。
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

  // 只断言六个结果互不相同抓不到语义对调：把 success 和 destructive 的 token
  // 换个位置，六个结果依然互不相同，但「成功」显示成红色。所以钉的是映射本身。
  it.each([
    ["default", "bg-primary"],
    ["secondary", "bg-secondary"],
    ["success", "var(--success-muted)"],
    ["warning", "var(--warning-muted)"],
    ["destructive", "var(--error-muted)"],
    ["outline", "bg-transparent"],
  ] as const)("maps the %s variant to its own token", (variant, token) => {
    expect(badgeVariants({ variant })).toContain(token);
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
