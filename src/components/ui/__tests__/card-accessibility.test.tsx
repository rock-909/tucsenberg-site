import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../card";

describe("Card accessibility", () => {
  it("supports semantic roles and heading attributes supplied by callers", () => {
    render(
      <Card role="article">
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Accessible Title
          </CardTitle>
          <CardDescription>Accessible description</CardDescription>
        </CardHeader>
        <CardContent>Accessible content</CardContent>
      </Card>,
    );

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Accessible Title",
    );
  });

  it("forwards ARIA labelling attributes on the card shell", () => {
    render(
      <Card aria-labelledby="card-title" aria-describedby="card-description">
        <CardHeader>
          <CardTitle id="card-title">ARIA Title</CardTitle>
          <CardDescription id="card-description">
            ARIA Description
          </CardDescription>
        </CardHeader>
      </Card>,
    );

    const card = screen.getByLabelText("ARIA Title");
    expect(card).toHaveAttribute("aria-describedby", "card-description");
  });
});
