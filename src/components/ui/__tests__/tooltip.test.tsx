/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
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

function renderTooltip() {
  return render(
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button">More info</button>
        </TooltipTrigger>
        <TooltipContent>Supplemental hint</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
}

describe("Tooltip", () => {
  it("shows content on hover and hides it on pointer leave", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.hover(screen.getByRole("button", { name: "More info" }));

    await waitFor(() => {
      expect(getTooltipContent()).toHaveTextContent("Supplemental hint");
      expect(getTooltipContent()).toBeVisible();
    });

    await user.unhover(screen.getByRole("button", { name: "More info" }));

    await waitFor(() => {
      const content = getTooltipContent();
      expect(content === null || !content.matches(":visible")).toBe(true);
    });
  });

  it("exposes stable data slots and merges classes", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="custom-trigger">
              Explain
            </button>
          </TooltipTrigger>
          <TooltipContent className="custom-content">
            Short explanation
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Explain" });
    expect(trigger).toHaveAttribute("data-slot", "tooltip-trigger");
    expect(trigger).toHaveClass("custom-trigger");

    await user.hover(trigger);

    await waitFor(() => {
      const content = getTooltipContent();
      expect(content).toHaveAttribute("data-slot", "tooltip-content");
      expect(content).toHaveClass("custom-content");
      expect(content).toHaveTextContent("Short explanation");
    });
  });

  it("forwards consumer ref to the visible tooltip content surface", async () => {
    const user = userEvent.setup();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">More info</button>
          </TooltipTrigger>
          <TooltipContent ref={contentRef}>Supplemental hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    await user.hover(screen.getByRole("button", { name: "More info" }));

    await waitFor(() => {
      expect(contentRef.current).not.toBeNull();
      expect(contentRef.current).toHaveAttribute(
        "data-slot",
        "tooltip-content",
      );
      expect(contentRef.current).toHaveTextContent("Supplemental hint");
    });

    await user.unhover(screen.getByRole("button", { name: "More info" }));

    await waitFor(() => {
      const content = getTooltipContent();
      expect(content === null || !content.matches(":visible")).toBe(true);
    });
  });
});
