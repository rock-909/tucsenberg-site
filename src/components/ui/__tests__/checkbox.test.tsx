/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Label } from "@/components/ui/label";
import { Checkbox } from "../checkbox";

vi.mock("lucide-react", () => ({
  CheckIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="check-icon" className={className} {...props} />
  ),
  MinusIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="minus-icon" className={className} {...props} />
  ),
}));

beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
});

describe("Checkbox", () => {
  it("shows the default checked state", () => {
    render(
      <Checkbox
        id="default-newsletter"
        defaultChecked
        aria-label="Newsletter"
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Newsletter" })).toBeChecked();
  });

  it("toggles when clicked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        id="analytics"
        aria-label="Analytics"
        onCheckedChange={onCheckedChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Analytics" }));

    expect(screen.getByRole("checkbox", { name: "Analytics" })).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles when its label is clicked", async () => {
    const user = userEvent.setup();
    render(
      <div className="flex items-center gap-2">
        <Checkbox id="label-toggle" />
        <Label htmlFor="label-toggle">Enable updates</Label>
      </div>,
    );

    await user.click(screen.getByText("Enable updates"));

    expect(
      screen.getByRole("checkbox", { name: "Enable updates" }),
    ).toBeChecked();
  });

  it("keeps disabled checkboxes unavailable", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        id="disabled-checkbox"
        aria-label="Disabled option"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Disabled option",
    });

    expect(checkbox).toBeDisabled();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("submits the checked value through FormData", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Checkbox id="package-updates" name="packageUpdates" value="yes" />
        <Label htmlFor="package-updates">Package updates</Label>
      </form>,
    );

    await user.click(screen.getByRole("checkbox", { name: "Package updates" }));

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("packageUpdates")).toBe("yes");
  });

  it("submits the default on value through FormData", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Checkbox id="default-value" name="defaultValue" />
        <Label htmlFor="default-value">Default value</Label>
      </form>,
    );

    await user.click(screen.getByRole("checkbox", { name: "Default value" }));

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("defaultValue")).toBe("on");
  });

  it("omits unchecked optional values from FormData", () => {
    render(
      <form data-testid="form">
        <Checkbox id="optional-updates" name="optionalUpdates" />
        <Label htmlFor="optional-updates">Optional updates</Label>
      </form>,
    );

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).has("optionalUpdates")).toBe(false);
  });

  it("propagates required form semantics inside a form", () => {
    render(
      <form data-testid="form">
        <Checkbox id="required-choice" name="requiredChoice" required />
        <Label htmlFor="required-choice">Required choice</Label>
      </form>,
    );

    expect(
      document.querySelector('input[name="requiredChoice"][type="checkbox"]'),
    ).toHaveAttribute("required", "");
  });

  it("renders indeterminate state with the indicator slot", () => {
    render(
      <Checkbox
        id="partial-selection"
        aria-label="Partial selection"
        checked="indeterminate"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Partial selection",
    });

    expect(checkbox).toHaveAttribute("data-state", "indeterminate");
    expect(screen.getByTestId("minus-icon")).toBeInTheDocument();
    expect(
      checkbox.querySelector('[data-slot="checkbox-indicator"]'),
    ).toBeInTheDocument();
  });

  it("renders indeterminate defaultChecked state with the minus icon", () => {
    render(
      <Checkbox
        id="default-indeterminate"
        aria-label="Default indeterminate"
        defaultChecked="indeterminate"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Default indeterminate",
    });

    expect(checkbox).toHaveAttribute("data-state", "indeterminate");
    expect(screen.getByTestId("minus-icon")).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toHaveClass(
      "group-data-[state=indeterminate]:hidden",
    );
  });

  it("exposes stable slots and merges public classes", () => {
    render(
      <Checkbox
        id="custom-checkbox"
        aria-label="Custom checkbox"
        defaultChecked
        className="custom-checkbox"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Custom checkbox",
    });

    expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    expect(checkbox).toHaveClass("custom-checkbox");
    expect(
      checkbox.querySelector('[data-slot="checkbox-indicator"]'),
    ).toBeInTheDocument();
  });
});
