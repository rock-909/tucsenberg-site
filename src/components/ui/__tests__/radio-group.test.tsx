import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

describe("RadioGroup", () => {
  it("selects one value and contributes it to real FormData", async () => {
    const user = userEvent.setup();

    render(
      <form data-testid="form">
        <RadioGroup name="theme" defaultValue="system">
          <RadioGroupItem id="theme-system" value="system" />
          <Label htmlFor="theme-system">System</Label>
          <RadioGroupItem id="theme-dark" value="dark" />
          <Label htmlFor="theme-dark">Dark</Label>
        </RadioGroup>
      </form>,
    );

    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-ui-pilot",
      "radix-primitive-radio-group",
    );

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("theme")).toBe("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "data-slot",
      "radio-group-item",
    );
  });

  it("emits controlled value changes", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <RadioGroup value="system" onValueChange={handleValueChange}>
        <RadioGroupItem id="theme-system" value="system" />
        <Label htmlFor="theme-system">System</Label>
        <RadioGroupItem id="theme-dark" value="dark" />
        <Label htmlFor="theme-dark">Dark</Label>
      </RadioGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(handleValueChange).toHaveBeenCalledWith("dark");
  });
});
