import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

describe("DropdownMenu", () => {
  it("opens with keyboard, activates an item, and closes", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="content">
          <DropdownMenuItem data-testid="item">Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    fireEvent.keyDown(screen.getByTestId("trigger"), { key: "Enter" });

    expect(await screen.findByTestId("content")).toHaveAttribute(
      "data-slot",
      "dropdown-menu-content",
    );

    fireEvent.click(screen.getByTestId("item"));

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("forwards public markers and item attributes", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="content">
          <DropdownMenuItem
            data-testid="item"
            data-locale="es"
            onSelect={(event) => event.preventDefault()}
          >
            Español
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByTestId("trigger")).toHaveAttribute(
      "data-slot",
      "dropdown-menu-trigger",
    );
    expect(screen.getByTestId("content")).toHaveAttribute(
      "data-slot",
      "dropdown-menu-content",
    );
    expect(screen.getByTestId("item")).toHaveAttribute(
      "data-slot",
      "dropdown-menu-item",
    );
    expect(screen.getByTestId("item")).toHaveAttribute("data-locale", "es");
  });
});
