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

describe("Card components", () => {
  it("renders the root card shell and forwards div props", () => {
    render(
      <Card
        id="test-card"
        className="custom-card"
        data-testid="card"
        role="article"
      >
        Card Content
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("id", "test-card");
    expect(card).toHaveAttribute("role", "article");
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveClass(
      "flex",
      "flex-col",
      "gap-6",
      "rounded-xl",
      "border",
      "bg-card",
      "text-card-foreground",
      "custom-card",
    );
  });

  it.each([
    [CardHeader, "card-header", "grid", "custom-header"],
    [CardTitle, "card-title", "font-semibold", "custom-title"],
    [
      CardDescription,
      "card-description",
      "text-muted-foreground",
      "custom-description",
    ],
    [CardAction, "card-action", "justify-self-end", "custom-action"],
    [CardContent, "card-content", "px-6", "custom-content"],
    [CardFooter, "card-footer", "items-center", "custom-footer"],
  ] as const)(
    "renders %s with its data slot and merged classes",
    (Component, slot, baseClass, customClass) => {
      render(
        <Component className={customClass} data-testid={slot}>
          {slot}
        </Component>,
      );

      const element = screen.getByTestId(slot);
      expect(element).toHaveAttribute("data-slot", slot);
      expect(element).toHaveClass(baseClass, customClass);
      expect(element).toHaveTextContent(slot);
    },
  );
});
