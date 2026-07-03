/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

vi.mock("lucide-react", () => ({
  XIcon: ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg data-testid="x-icon" className={className} {...props} />
  ),
}));

describe("Dialog accessibility", () => {
  it("opens with keyboard activation and exposes dialog title and description", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    screen.getByRole("button", { name: "Open Dialog" }).focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("Accessible Dialog");
      expect(dialog).toHaveAccessibleDescription("Dialog description");
      expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    });
  });

  it("does not expose an accessible description for title-only dialogs", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title only</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toHaveAccessibleDescription();
    });
  });

  it("renders a close button with a screen-reader label", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Closable Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
  });

  it("supports custom closeLabel accessibility", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent closeLabel="Dismiss dialog">
          <DialogTitle>Closable Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Dismiss dialog" }),
      ).toBeInTheDocument();
    });
  });
});
