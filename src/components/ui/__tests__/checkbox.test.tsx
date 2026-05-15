import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

describe("Checkbox", () => {
  it("contributes checked values to real FormData", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <Checkbox id="privacy" name="acceptPrivacy" value="yes" />
        <Label htmlFor="privacy">Accept privacy</Label>
      </form>,
    );

    await user.click(screen.getByRole("checkbox", { name: /accept privacy/i }));

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("acceptPrivacy")).toBe("yes");
  });

  it("omits unchecked values from real FormData", () => {
    render(
      <form data-testid="form">
        <Checkbox id="marketing" name="marketingConsent" value="yes" />
        <Label htmlFor="marketing">Marketing consent</Label>
      </form>,
    );

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).has("marketingConsent")).toBe(false);
  });

  it("supports label click toggling", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Checkbox id="privacy" name="acceptPrivacy" />
        <Label htmlFor="privacy">Accept privacy</Label>
      </form>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /accept privacy/i });
    await user.click(screen.getByText("Accept privacy"));

    expect(checkbox).toBeChecked();
  });

  it("preserves required, disabled, and stable input locator contracts", () => {
    render(
      <form data-testid="form">
        <Checkbox id="privacy" name="acceptPrivacy" required disabled />
        <Label htmlFor="privacy">Accept privacy</Label>
      </form>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /accept privacy/i });
    const form = screen.getByTestId("form");
    const input = form.querySelector('input[name="acceptPrivacy"]');

    expect(checkbox).toBeRequired();
    expect(checkbox).toBeDisabled();
    expect(input).toBeInstanceOf(HTMLInputElement);
  });

  it("forwards the ref to the public checkbox control", () => {
    const checkboxRef = createRef<HTMLButtonElement>();

    render(<Checkbox ref={checkboxRef} aria-label="Accept privacy" />);

    expect(checkboxRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(checkboxRef.current).toHaveAttribute("data-slot", "checkbox");
  });
});
