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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

vi.mock("lucide-react", () => ({
  XIcon: ({ className, ...props }: React.ComponentProps<"svg">) => (
    <svg data-testid="x-icon" className={className} {...props} />
  ),
}));

describe("Dialog", () => {
  it("renders trigger and opens content on click", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("trigger"));

    await waitFor(() => {
      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  it("supports controlled open state", () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();

    rerender(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const content = screen.getByTestId("content");
    expect(content).toHaveAttribute("data-slot", "dialog-content");
    expect(content).toHaveClass(
      "max-w-lg",
      "border",
      "max-h-[calc(100dvh-2rem)]",
      "overflow-y-auto",
    );
  });

  it("renders text subcomponents with data slots and merged classes", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle className="custom-title">Header Title</DialogTitle>
            <DialogDescription>Header Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer" data-testid="footer">
            <button type="button">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("header")).toHaveAttribute(
        "data-slot",
        "dialog-header",
      );
      expect(screen.getByTestId("header")).toHaveClass("p-4", "custom-header");
      expect(screen.getByText("Header Title")).toHaveClass(
        "font-semibold",
        "custom-title",
      );
      expect(screen.getByText("Header Description")).toHaveAttribute(
        "data-slot",
        "dialog-description",
      );
      expect(screen.getByTestId("footer")).toHaveClass(
        "mt-auto",
        "custom-footer",
      );
    });
  });

  it("merges className on DialogContent", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-content" data-testid="content">
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("content")).toHaveClass(
        "max-w-lg",
        "custom-content",
      );
    });
  });

  it("supports custom closeLabel on close button", async () => {
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
