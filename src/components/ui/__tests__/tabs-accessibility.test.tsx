/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

describe("Tabs accessibility", () => {
  it("supports keyboard navigation without relying on Radix internal DOM", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Product sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="specs">Specs panel</TabsContent>
      </Tabs>,
    );

    const overview = screen.getByRole("tab", { name: "Overview" });
    const specs = screen.getByRole("tab", { name: "Specs" });

    overview.focus();
    expect(overview).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(specs).toHaveFocus();
    expect(specs).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Specs panel")).toBeVisible();
  });
});
