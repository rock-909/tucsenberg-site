/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

describe("DropdownMenu", () => {
  it("opens menu content from the trigger and renders a menu item", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open language menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>English</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.queryByRole("menuitem", { name: "English" })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Open language menu" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "English" }),
      ).toBeInTheDocument();
    });
  });

  it("supports keyboard opening and menu item focus", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Choose language</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>English</DropdownMenuItem>
          <DropdownMenuItem>简体中文</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Choose language" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    expect(screen.getByRole("menuitem", { name: "English" })).toHaveFocus();
  });

  it("uses safe motion hooks and high-contrast focused item text", async () => {
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>English</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const menu = await screen.findByRole("menu");
    const item = screen.getByRole("menuitem", { name: "English" });

    expect(menu).toHaveAttribute("data-slot", "dropdown-menu-content");
    expect(menu).toHaveClass("data-[state=open]:animate-in");
    expect(menu).toHaveClass("data-[state=closed]:animate-out");
    expect(menu).toHaveClass("data-[side=bottom]:slide-in-from-top-1");
    expect(menu).toHaveClass("data-[side=top]:slide-in-from-bottom-1");
    expect(menu).not.toHaveClass("opacity-0");
    expect(menu).not.toHaveClass("invisible");
    expect(menu).not.toHaveClass("hidden");
    expect(menu).not.toHaveClass("pointer-events-none");
    expect(item).toHaveClass("focus:text-foreground");
    expect(item).not.toHaveClass("focus:text-accent-foreground");
  });
});
