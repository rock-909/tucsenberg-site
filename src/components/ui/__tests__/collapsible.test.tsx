import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

describe("Collapsible", () => {
  it("opens and closes content through the local wrapper", async () => {
    const user = userEvent.setup();

    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle details</CollapsibleTrigger>
        <CollapsibleContent>Hidden details</CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole("button", { name: "Toggle details" });
    expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    expect(screen.queryByText("Hidden details")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByText("Hidden details")).toHaveAttribute(
      "data-slot",
      "collapsible-content",
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);

    expect(screen.queryByText("Hidden details")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("supports controlled open state and public markers", () => {
    render(
      <Collapsible open>
        <CollapsibleTrigger>Toggle details</CollapsibleTrigger>
        <CollapsibleContent>Hidden details</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByText("Hidden details").parentElement).toHaveAttribute(
      "data-ui-pilot",
      "radix-primitive-collapsible",
    );
  });
});
