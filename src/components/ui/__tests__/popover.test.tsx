/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "../popover";

describe("Popover", () => {
  it("opens on click and closes with PopoverClose", async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open details</button>
        </PopoverTrigger>
        <PopoverContent>
          <p>Compact details</p>
          <PopoverClose asChild>
            <button type="button">Close</button>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText("Compact details")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open details" }));

    expect(await screen.findByText("Compact details")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByText("Compact details")).not.toBeInTheDocument();
    });
  });

  it("supports controlled dismissal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Popover open onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button type="button">Open details</button>
        </PopoverTrigger>
        <PopoverContent>
          <p>Controlled details</p>
          <PopoverClose asChild>
            <button type="button">Close</button>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("exposes stable slots, viewport-safe classes, and merged classes", async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="custom-trigger">
            Open details
          </button>
        </PopoverTrigger>
        <PopoverContent className="custom-content">
          Compact details
        </PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open details" });
    expect(trigger).toHaveAttribute("data-slot", "popover-trigger");
    expect(trigger).toHaveClass("custom-trigger");

    await user.click(trigger);

    const content = await screen.findByText("Compact details");
    const panel = content.closest("[data-slot='popover-content']");

    expect(panel).toHaveClass(
      "max-w-[calc(100vw-2rem)]",
      "max-h-[calc(100dvh-2rem)]",
      "overflow-y-auto",
      "custom-content",
    );
  });
});
