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

describe("Card integration", () => {
  it("composes a full card layout without hiding nested actions or content", () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
          <CardAction>
            <button type="button">Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <button type="button">Footer Button</button>
        </CardFooter>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toContainElement(screen.getByText("Card Title"));
    expect(card).toContainElement(screen.getByText("Card description text"));
    expect(card).toContainElement(
      screen.getByRole("button", { name: "Action" }),
    );
    expect(card).toContainElement(
      screen.getByText("This is the main content of the card."),
    );
    expect(card).toContainElement(
      screen.getByRole("button", { name: "Footer Button" }),
    );
    expect(screen.getByTestId("header")).toHaveClass(
      "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
    );
  });
});
