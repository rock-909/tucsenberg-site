/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

describe("Popover accessibility", () => {
  it("opens with keyboard activation and closes with Escape", async () => {
    const user = userEvent.setup();

    render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open details</button>
        </PopoverTrigger>
        <PopoverContent>Compact details</PopoverContent>
      </Popover>,
    );

    const trigger = screen.getByRole("button", { name: "Open details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Compact details");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(dialog).toHaveAttribute("id", controlsId);

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
    });
  });
});
