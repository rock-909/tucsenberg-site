import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "@/components/ui/textarea";

function getControlSurface(control: HTMLElement): HTMLElement {
  const surface = control.closest(".w-full");
  expect(surface).toBeInstanceOf(HTMLElement);
  return surface as HTMLElement;
}

describe("Textarea", () => {
  it("renders a Radix-backed textarea surface with public markers", () => {
    render(<Textarea placeholder="Message" data-testid="textarea" />);

    const textarea = screen.getByPlaceholderText("Message");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
    expect(textarea).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-form-control",
    );
    expect(getControlSurface(textarea)).toHaveClass("w-full");
  });

  it("forwards attributes and custom classes", () => {
    render(
      <Textarea
        id="message"
        name="message"
        className="custom-textarea"
        defaultValue="Need quote"
        rows={6}
        required
        data-testid="textarea"
      />,
    );

    const textarea = screen.getByTestId("textarea");
    expect(textarea).toHaveAttribute("id", "message");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toBeRequired();
    expect(textarea).toHaveValue("Need quote");
    expect(document.querySelector(".custom-textarea")).toContainElement(
      textarea,
    );
  });

  it("emits user input and keyboard/focus events", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    const handleKeyDown = vi.fn();

    render(
      <Textarea
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />,
    );

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "message");
    fireEvent.keyDown(textarea, { key: "Enter" });
    fireEvent.blur(textarea);

    expect(textarea).toHaveValue("message");
    expect(handleChange).toHaveBeenCalled();
    expect(handleFocus).toHaveBeenCalled();
    expect(handleKeyDown).toHaveBeenCalled();
    expect(handleBlur).toHaveBeenCalled();
  });

  it("keeps disabled textareas non-interactive", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleFocus = vi.fn();

    render(<Textarea disabled onChange={handleChange} onFocus={handleFocus} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.type(textarea, "message");

    expect(textarea).toBeDisabled();
    expect(handleChange).not.toHaveBeenCalled();
    expect(handleFocus).not.toHaveBeenCalled();
    expect(getControlSurface(textarea)).toHaveClass(
      "has-[textarea:disabled]:cursor-not-allowed",
      "has-[textarea:disabled]:opacity-50",
    );
  });

  it("applies invalid and focus state classes through the Radix textarea surface", () => {
    render(<Textarea aria-invalid placeholder="Message" />);

    const textarea = screen.getByPlaceholderText("Message");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(getControlSurface(textarea)).toHaveClass(
      "focus-within:ring-2",
      "focus-within:ring-ring",
      "has-[textarea[aria-invalid=true]]:border-destructive",
      "has-[textarea[aria-invalid=true]]:ring-destructive/20",
    );
  });

  it("forwards refs to the underlying textarea", () => {
    const ref = { current: null as HTMLTextAreaElement | null };

    render(
      <Textarea
        ref={(node) => {
          ref.current = node;
        }}
      />,
    );

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("includes typed textarea value in real FormData", async () => {
    const user = userEvent.setup();

    render(
      <form aria-label="lead form">
        <Textarea name="message" placeholder="Message" />
      </form>,
    );

    await user.type(screen.getByPlaceholderText("Message"), "Need quote");

    const form = screen.getByRole("form", {
      name: "lead form",
    }) as HTMLFormElement;

    expect(new FormData(form).get("message")).toBe("Need quote");
  });

  it("includes textarea defaultValue in real FormData", () => {
    render(
      <form aria-label="lead form">
        <Textarea name="message" defaultValue="Need quote" />
      </form>,
    );

    const form = screen.getByRole("form", {
      name: "lead form",
    }) as HTMLFormElement;

    expect(new FormData(form).get("message")).toBe("Need quote");
  });
});
