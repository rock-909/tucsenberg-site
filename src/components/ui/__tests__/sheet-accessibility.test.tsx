/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "../sheet";

vi.mock("lucide-react", () => ({
  XIcon: ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg data-testid="x-icon" className={className} {...props} />
  ),
}));

describe("Sheet accessibility", () => {
  it("opens with keyboard activation and exposes dialog title and description", async () => {
    const user = userEvent.setup();

    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Accessible Sheet</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    screen.getByRole("button", { name: "Open Sheet" }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveAccessibleName(
        "Accessible Sheet",
      );
      expect(screen.getByText("Sheet description")).toBeInTheDocument();
    });
  });

  it("renders a close button with a screen-reader label", async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Closable Sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
  });
});
