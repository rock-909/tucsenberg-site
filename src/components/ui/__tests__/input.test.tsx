import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "@/components/ui/input";

function getControlSurface(control: HTMLElement): HTMLElement {
  const surface = control.closest(".w-full");
  expect(surface).toBeInstanceOf(HTMLElement);
  return surface as HTMLElement;
}

describe("Input", () => {
  it("renders the default textbox shell with placeholder and base classes", () => {
    render(<Input placeholder="Enter text here" data-testid="input" />);

    const input = screen.getByPlaceholderText("Enter text here");
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveAttribute("data-ui-pilot", "radix-themes-form-control");
    expect(getControlSurface(input)).toHaveClass("w-full");
  });

  it.each([
    ["email", "textbox"],
    ["password", null],
    ["number", "spinbutton"],
    ["search", "searchbox"],
    ["tel", "textbox"],
    ["url", "textbox"],
    ["file", null],
  ] as const)("passes through type=%s", (type, role) => {
    render(<Input type={type} data-testid="input" />);

    const input = role ? screen.getByRole(role) : screen.getByTestId("input");
    expect(input).toHaveAttribute("type", type);
  });

  it("merges custom classes and forwards input attributes", () => {
    render(
      <Input
        id="test-input"
        name="testName"
        className="custom-input"
        value="test value"
        maxLength={50}
        required
        readOnly
        data-testid="input"
      />,
    );

    const input = screen.getByTestId("input");
    expect(input).toHaveAttribute("id", "test-input");
    expect(input).toHaveAttribute("name", "testName");
    expect(input).toHaveValue("test value");
    expect(input).toHaveAttribute("maxlength", "50");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("readonly");
    expect(document.querySelector(".custom-input")).toContainElement(input);
  });

  it("emits user input and keyboard/focus events", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    const handleKeyDown = vi.fn();

    render(
      <Input
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />,
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "test");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.blur(input);

    expect(input).toHaveValue("test");
    expect(handleChange).toHaveBeenCalled();
    expect(handleFocus).toHaveBeenCalled();
    expect(handleKeyDown).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalled();
  });

  it("keeps disabled inputs non-interactive", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleFocus = vi.fn();

    render(<Input disabled onChange={handleChange} onFocus={handleFocus} />);

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.type(input, "test");

    expect(input).toBeDisabled();
    expect(getControlSurface(input)).toHaveClass(
      "has-[input:disabled]:pointer-events-none",
      "has-[input:disabled]:opacity-50",
    );
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleFocus).not.toHaveBeenCalled();
  });

  it("applies invalid and focus state classes through the Radix control surface", () => {
    render(<Input aria-invalid placeholder="Email" />);

    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(getControlSurface(input)).toHaveClass(
      "focus-within:border-ring",
      "focus-within:ring-[3px]",
      "has-[input[aria-invalid=true]]:border-destructive",
      "has-[input[aria-invalid=true]]:ring-destructive/20",
    );
  });

  it("supports file input styling and change events", () => {
    const handleChange = vi.fn();
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    render(
      <Input type="file" onChange={handleChange} data-testid="file-input" />,
    );

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(input).toHaveClass(
      "file:inline-flex",
      "file:h-7",
      "file:text-foreground",
      "file:font-medium",
    );
    expect(handleChange).toHaveBeenCalled();
  });

  it("keeps hidden inputs native and out of the Radix form-control surface", () => {
    render(
      <Input
        type="hidden"
        name="trackingId"
        value="lead-123"
        data-testid="hidden-input"
      />,
    );

    const input = screen.getByTestId("hidden-input");
    expect(input).toHaveAttribute("type", "hidden");
    expect(input).not.toHaveAttribute("data-ui-pilot");
  });

  it("includes hidden input name/value in real FormData", () => {
    render(
      <form aria-label="lead form">
        <Input type="hidden" name="trackingId" value="lead-123" />
      </form>,
    );

    const form = screen.getByRole("form", {
      name: "lead form",
    }) as HTMLFormElement;

    expect(new FormData(form).get("trackingId")).toBe("lead-123");
  });

  it("includes typed textual input in real FormData", async () => {
    const user = userEvent.setup();

    render(
      <form aria-label="lead form">
        <Input name="email" type="email" placeholder="Email" />
      </form>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "buyer@example.com");

    const form = screen.getByRole("form", {
      name: "lead form",
    }) as HTMLFormElement;

    expect(new FormData(form).get("email")).toBe("buyer@example.com");
  });

  it("includes textual defaultValue in real FormData", () => {
    render(
      <form aria-label="lead form">
        <Input name="email" type="email" defaultValue="buyer@example.com" />
      </form>,
    );

    const form = screen.getByRole("form", {
      name: "lead form",
    }) as HTMLFormElement;

    expect(new FormData(form).get("email")).toBe("buyer@example.com");
  });
});
