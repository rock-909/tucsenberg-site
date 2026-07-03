import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders inside the Radix form-control surface", () => {
    render(<Textarea placeholder="Message" />);

    const textarea = screen.getByPlaceholderText("Message");
    const surface = textarea.closest(
      "[data-ui-pilot='radix-themes-form-control']",
    );

    expect(surface).toBeInTheDocument();
    expect(surface).toHaveClass("contents");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("forwards native textarea attributes", () => {
    render(
      <Textarea
        id="message"
        name="message"
        placeholder="Message"
        rows={6}
        required
        disabled
        aria-describedby="message-help"
      />,
    );

    const textarea = screen.getByPlaceholderText("Message");
    expect(textarea).toHaveAttribute("id", "message");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("aria-describedby", "message-help");
  });

  it("supports typing and change events", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea onChange={handleChange} placeholder="Message" />);

    const textarea = screen.getByPlaceholderText("Message");
    await user.type(textarea, "Need a quote");

    expect(textarea).toHaveValue("Need a quote");
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders string defaultValue correctly", () => {
    render(<Textarea defaultValue="Initial" placeholder="Message" />);

    expect(screen.getByPlaceholderText("Message")).toHaveValue("Initial");
  });

  it("renders controlled string value correctly", () => {
    render(<Textarea placeholder="Message" readOnly value="Fixed" />);

    expect(screen.getByPlaceholderText("Message")).toHaveValue("Fixed");
  });

  it("submits typed values through native FormData", async () => {
    const user = userEvent.setup();

    render(
      <form data-testid="form">
        <Textarea name="message" placeholder="Message" />
      </form>,
    );

    await user.type(screen.getByPlaceholderText("Message"), "Need a quote");

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("message")).toBe("Need a quote");
  });

  it("submits default values through native FormData", () => {
    render(
      <form data-testid="form">
        <Textarea name="message" defaultValue="Initial message" />
      </form>,
    );

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("message")).toBe("Initial message");
  });

  it("forwards refs to the native textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();

    render(<Textarea ref={ref} placeholder="Message" />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    ref.current?.focus();
    expect(screen.getByPlaceholderText("Message")).toHaveFocus();
  });

  it("emits focus and blur events", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    const handleFocus = vi.fn();

    render(
      <Textarea
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="Message"
      />,
    );

    const textarea = screen.getByPlaceholderText("Message");
    await user.click(textarea);
    fireEvent.blur(textarea);

    expect(handleFocus).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalled();
  });

  it("keeps disabled textareas non-interactive", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleFocus = vi.fn();

    render(
      <Textarea
        disabled
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Message"
      />,
    );

    const textarea = screen.getByPlaceholderText("Message");
    await user.click(textarea);
    await user.type(textarea, "Need a quote");

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveValue("");
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleFocus).not.toHaveBeenCalled();
  });
});
