import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders a native input with the governed control contract", () => {
    render(<Input placeholder="Enter text here" data-testid="input" />);

    const input = screen.getByPlaceholderText("Enter text here");

    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveClass("h-10", "border", "rounded-[9px]");
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

    expect(input).toHaveClass("custom-input");
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
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleFocus).not.toHaveBeenCalled();
  });

  it("supports file input styling and change events", () => {
    const handleChange = vi.fn();
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    render(
      <Input type="file" onChange={handleChange} data-testid="file-input" />,
    );

    const input = screen.getByTestId("file-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveClass(
      "h-10",
      "rounded-[9px]",
      "border",
      "file:inline-flex",
      "file:h-7",
      "file:text-foreground",
      "file:font-medium",
    );
    expect(handleChange).toHaveBeenCalled();
  });

  it("keeps hidden inputs native and includes them in FormData", () => {
    render(
      <form data-testid="form">
        <Input
          type="hidden"
          name="trackingId"
          value="lead-123"
          readOnly
          data-testid="hidden-input"
        />
      </form>,
    );

    const input = screen.getByTestId("hidden-input");
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(input).toHaveAttribute("type", "hidden");
    expect(new FormData(form).get("trackingId")).toBe("lead-123");
  });

  it("submits typed textual values through native FormData", async () => {
    const user = userEvent.setup();

    render(
      <form data-testid="form">
        <Input name="email" placeholder="Email" />
      </form>,
    );

    await user.type(screen.getByRole("textbox"), "buyer@example.com");

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("email")).toBe("buyer@example.com");
  });

  it("submits default textual values through native FormData", () => {
    render(
      <form data-testid="form">
        <Input name="email" defaultValue="initial@example.com" />
      </form>,
    );

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("email")).toBe("initial@example.com");
  });

  it("forwards refs to textual inputs", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} placeholder="Email" type="email" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it("forwards refs to file inputs", () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} type="file" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "file");
  });

  it("does not throw when file inputs receive an incompatible value", () => {
    expect(() => {
      render(<Input type="file" value="invalid" data-testid="file-input" />);
    }).not.toThrow();

    expect(screen.getByTestId("file-input")).toHaveAttribute("type", "file");
  });
});
