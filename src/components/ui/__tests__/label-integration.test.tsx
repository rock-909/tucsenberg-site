import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Label } from "@/components/ui/label";

describe("Label integration", () => {
  it("works in a basic form field with help and error text", () => {
    render(
      <div>
        <Label htmlFor="name">Name</Label>
        <input id="name" aria-describedby="name-help name-error" />
        <p id="name-help">Use your legal name.</p>
        <p id="name-error" role="alert">
          Name is required.
        </p>
      </div>,
    );

    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-describedby", "name-help name-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
  });

  it("preserves label-controlled checkbox behavior", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <div>
        <input id="terms" type="checkbox" onChange={handleChange} />
        <Label htmlFor="terms">Accept terms</Label>
      </div>,
    );

    await user.click(screen.getByText("Accept terms"));

    expect(screen.getByLabelText("Accept terms")).toBeChecked();
    expect(handleChange).toHaveBeenCalled();
  });
});
