/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

function getTooltipContent(): HTMLElement | null {
  return document.querySelector('[data-slot="tooltip-content"]');
}

describe("Tooltip accessibility", () => {
  it("shows content on focus and closes with Escape", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">More info</button>
          </TooltipTrigger>
          <TooltipContent>Supplemental hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.tab();

    await waitFor(() => {
      expect(getTooltipContent()).toHaveTextContent("Supplemental hint");
      expect(getTooltipContent()).toBeVisible();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      const content = getTooltipContent();
      expect(content === null || !content.matches(":visible")).toBe(true);
    });
  });

  it("links the trigger to supplemental content through aria-describedby", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">More info</button>
          </TooltipTrigger>
          <TooltipContent>Supplemental hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "More info" });
    await user.tab();

    await waitFor(() => {
      const describedBy = trigger.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      const description = document.getElementById(describedBy ?? "");
      expect(description).not.toBeNull();
      expect(description).toHaveTextContent("Supplemental hint");
    });
  });

  it("dismisses on blur and clears the open content surface", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">More info</button>
          </TooltipTrigger>
          <TooltipContent>Supplemental hint</TooltipContent>
        </Tooltip>
        <button type="button">Next field</button>
      </TooltipProvider>,
    );

    await user.tab();

    await waitFor(() => {
      expect(getTooltipContent()).toBeVisible();
    });

    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus();
      const content = getTooltipContent();
      expect(content === null || !content.matches(":visible")).toBe(true);
    });
  });
});
