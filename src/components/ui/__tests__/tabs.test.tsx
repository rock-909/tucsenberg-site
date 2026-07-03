/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

function renderTabs() {
  return render(
    <Tabs defaultValue="overview">
      <TabsList aria-label="Product sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs">Specs</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="specs">Specs panel</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("shows the default tab panel", () => {
    renderTabs();

    expect(screen.getByText("Overview panel")).toBeVisible();
    expect(screen.queryByText("Specs panel")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("switches panels on click", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Specs" }));

    expect(screen.getByText("Specs panel")).toBeVisible();
    expect(screen.queryByText("Overview panel")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Specs" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("exposes stable data slots and merges classes", () => {
    render(
      <Tabs defaultValue="one" className="custom-tabs" data-testid="tabs">
        <TabsList className="custom-list" data-testid="list">
          <TabsTrigger className="custom-trigger" value="one">
            One
          </TabsTrigger>
        </TabsList>
        <TabsContent className="custom-content" value="one">
          One panel
        </TabsContent>
      </Tabs>,
    );

    expect(screen.getByTestId("tabs")).toHaveAttribute("data-slot", "tabs");
    expect(screen.getByTestId("tabs")).toHaveClass("custom-tabs");
    expect(screen.getByTestId("list")).toHaveAttribute(
      "data-slot",
      "tabs-list",
    );
    expect(screen.getByTestId("list")).toHaveClass("custom-list");
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "data-slot",
      "tabs-trigger",
    );
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-slot",
      "tabs-content",
    );
    expect(screen.getByRole("tabpanel")).toHaveClass("custom-content");
  });
});
