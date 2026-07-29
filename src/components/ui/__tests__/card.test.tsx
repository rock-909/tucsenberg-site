import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

/**
 * 原来分三个文件十条：card.test 用 `it.each` 逐个子组件断言 base class，
 * card-accessibility 两条断的是调用方自己传进去的 role / aria-*（React 原生保证），
 * card-integration 末尾断言 `has-data-[slot=card-action]:grid-cols-[1fr_auto]`
 * ——那条 class 恒在，jsdom 里证明不了布局真的会切换，视觉回归归
 * `core-page-visual-calibration.spec.ts` 管。
 *
 * 真正要守的是 data-slot：CSS 靠它选中各部分。生产用法在联系页和询盘静态兜底。
 */

describe("Card", () => {
  it("composes its parts, each carrying the data slot CSS selects on", () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="card-header">
          <CardTitle data-testid="card-title">Card Title</CardTitle>
          <CardDescription data-testid="card-description">
            Card description text
          </CardDescription>
          <CardAction data-testid="card-action">
            <button type="button">Action</button>
          </CardAction>
        </CardHeader>
        <CardContent data-testid="card-content">Main content</CardContent>
        <CardFooter data-testid="card-footer">
          <button type="button">Footer Button</button>
        </CardFooter>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-slot", "card");

    for (const slot of [
      "card-header",
      "card-title",
      "card-description",
      "card-action",
      "card-content",
      "card-footer",
    ]) {
      expect(screen.getByTestId(slot)).toHaveAttribute("data-slot", slot);
      expect(card).toContainElement(screen.getByTestId(slot));
    }

    expect(card).toContainElement(
      screen.getByRole("button", { name: "Action" }),
    );
    expect(card).toContainElement(
      screen.getByRole("button", { name: "Footer Button" }),
    );
  });

  it("keeps a caller's className alongside its own", () => {
    render(
      <Card className="custom-card" data-testid="card">
        Card Content
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveClass("custom-card", "surface-card");
  });
});
