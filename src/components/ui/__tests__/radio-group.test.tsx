/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "../radio-group";

vi.mock("lucide-react", () => ({
  CircleIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="circle-icon" className={className} {...props} />
  ),
}));

const pointerCaptureMethods = [
  "hasPointerCapture",
  "setPointerCapture",
  "releasePointerCapture",
] as const;

const originalPointerCaptureDescriptors = new Map<
  (typeof pointerCaptureMethods)[number],
  PropertyDescriptor | undefined
>();

beforeAll(() => {
  for (const method of pointerCaptureMethods) {
    originalPointerCaptureDescriptors.set(
      method,
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, method),
    );

    if (!HTMLElement.prototype[method]) {
      Object.defineProperty(HTMLElement.prototype, method, {
        configurable: true,
        writable: true,
        value: method === "hasPointerCapture" ? () => false : () => {},
      });
    }
  }
});

afterAll(() => {
  for (const method of pointerCaptureMethods) {
    const original = originalPointerCaptureDescriptors.get(method);

    if (original) {
      Object.defineProperty(HTMLElement.prototype, method, original);
      continue;
    }

    Reflect.deleteProperty(HTMLElement.prototype, method);
  }
});

function renderRadioGroup({
  onValueChange,
}: {
  onValueChange?: (value: string) => void;
} = {}) {
  return render(
    <RadioGroup
      aria-label="Website package"
      defaultValue="standard"
      onValueChange={onValueChange}
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-starter" value="starter" />
        <Label htmlFor="package-starter">Starter</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-standard" value="standard" />
        <Label htmlFor="package-standard">Standard</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-enterprise" value="enterprise" />
        <Label htmlFor="package-enterprise">Enterprise</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-disabled" value="disabled" disabled />
        <Label htmlFor="package-disabled">Disabled package</Label>
      </div>
    </RadioGroup>,
  );
}

describe("RadioGroup", () => {
  it("shows the default selected option", () => {
    renderRadioGroup();

    expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Starter" })).not.toBeChecked();
  });

  it("selects another option on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRadioGroup({ onValueChange });

    await user.click(screen.getByRole("radio", { name: "Enterprise" }));

    expect(screen.getByRole("radio", { name: "Enterprise" })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("enterprise");
  });

  it("selects another option when clicking the label", async () => {
    const user = userEvent.setup();
    renderRadioGroup();

    await user.click(screen.getByText("Starter"));

    expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
  });

  it("keeps disabled options unavailable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderRadioGroup({ onValueChange });

    const disabledOption = screen.getByRole("radio", {
      name: "Disabled package",
    });

    expect(disabledOption).toBeDisabled();

    await user.click(disabledOption);

    expect(disabledOption).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalledWith("disabled");
  });

  it("supports keyboard navigation between options", async () => {
    const user = userEvent.setup();
    renderRadioGroup();

    const standard = screen.getByRole("radio", { name: "Standard" });
    standard.focus();

    await user.keyboard("{ArrowDown>}{/ArrowDown}");

    expect(screen.getByRole("radio", { name: "Enterprise" })).toBeChecked();
  });

  it("submits selected value through native FormData", async () => {
    const user = userEvent.setup();

    render(
      <form data-testid="form">
        <RadioGroup
          name="package"
          defaultValue="standard"
          aria-label="Website package"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="form-starter" value="starter" />
            <Label htmlFor="form-starter">Starter</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="form-standard" value="standard" />
            <Label htmlFor="form-standard">Standard</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="form-enterprise" value="enterprise" />
            <Label htmlFor="form-enterprise">Enterprise</Label>
          </div>
        </RadioGroup>
      </form>,
    );

    const form = screen.getByTestId("form");

    expect(new FormData(form).get("package")).toBe("standard");

    await user.click(screen.getByRole("radio", { name: "Enterprise" }));

    expect(new FormData(form).get("package")).toBe("enterprise");
  });

  it("exposes stable slots and merges public classes", () => {
    render(
      <RadioGroup
        aria-label="Custom radio group"
        defaultValue="one"
        className="custom-group"
        data-testid="group"
      >
        <RadioGroupItem id="radio-one" value="one" className="custom-item" />
        <Label htmlFor="radio-one">One</Label>
      </RadioGroup>,
    );

    expect(screen.getByTestId("group")).toHaveAttribute(
      "data-slot",
      "radio-group",
    );
    expect(screen.getByTestId("group")).toHaveClass("custom-group");
    expect(screen.getByRole("radio", { name: "One" })).toHaveAttribute(
      "data-slot",
      "radio-group-item",
    );
    expect(screen.getByRole("radio", { name: "One" })).toHaveClass(
      "custom-item",
    );
    expect(
      screen
        .getByRole("radio", { name: "One" })
        .querySelector('[data-slot="radio-group-indicator"]'),
    ).toBeInTheDocument();
  });
});
