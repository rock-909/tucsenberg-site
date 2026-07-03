/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../select";

vi.mock("lucide-react", () => ({
  CheckIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="check-icon" className={className} {...props} />
  ),
  ChevronDownIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="chevron-down-icon" className={className} {...props} />
  ),
  ChevronUpIcon: ({ className, ...props }: ComponentProps<"svg">) => (
    <svg data-testid="chevron-up-icon" className={className} {...props} />
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
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
});

function renderSelect({
  onValueChange,
}: {
  onValueChange?: (value: string) => void;
} = {}) {
  return render(
    <Select defaultValue="standard" onValueChange={onValueChange}>
      <SelectTrigger aria-label="Website package">
        <SelectValue placeholder="Choose package" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Packages</SelectLabel>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
          <SelectItem value="disabled" disabled>
            Disabled package
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="custom">Custom project</SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("shows the default selected value", () => {
    renderSelect();

    expect(
      screen.getByRole("combobox", { name: "Website package" }),
    ).toHaveTextContent("Standard");
  });

  it("opens options and selects an item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole("combobox", { name: "Website package" }));

    expect(
      await screen.findByRole("option", { name: "Starter" }),
    ).toBeVisible();

    await user.click(screen.getByRole("option", { name: "Starter" }));

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith("starter");
    });
    expect(
      screen.getByRole("combobox", { name: "Website package" }),
    ).toHaveTextContent("Starter");
  });

  it("does not select disabled items", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    await user.click(screen.getByRole("combobox", { name: "Website package" }));

    const disabledOption = await screen.findByRole("option", {
      name: "Disabled package",
    });
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");

    await user.click(disabledOption);

    expect(onValueChange).not.toHaveBeenCalledWith("disabled");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Website package" }),
      ).toHaveTextContent("Standard");
    });
  });

  it("exposes stable slots and merges public classes", async () => {
    const user = userEvent.setup();

    render(
      <Select defaultValue="one">
        <SelectTrigger
          aria-label="Custom select"
          className="custom-trigger"
          data-testid="trigger"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectGroup className="custom-group">
            <SelectLabel className="custom-label">Numbers</SelectLabel>
            <SelectItem className="custom-item" value="one">
              One
            </SelectItem>
            <SelectItem value="two">Two</SelectItem>
          </SelectGroup>
          <SelectSeparator className="custom-separator" />
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByTestId("trigger");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveClass("custom-trigger");

    await user.click(trigger);

    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "data-slot",
      "select-content",
    );
    expect(screen.getByRole("listbox")).toHaveClass("custom-content");
    expect(screen.getByText("Numbers")).toHaveAttribute(
      "data-slot",
      "select-label",
    );
    expect(screen.getByText("Numbers")).toHaveClass("custom-label");
    expect(screen.getByRole("option", { name: "One" })).toHaveAttribute(
      "data-slot",
      "select-item",
    );
    expect(screen.getByRole("option", { name: "One" })).toHaveClass(
      "custom-item",
    );
    expect(
      document.querySelector("[data-slot='select-separator']"),
    ).toHaveClass("custom-separator");
    expect(document.querySelector("[data-slot='select-group']")).toHaveClass(
      "custom-group",
    );
  });
});
