import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ContactFormTextarea,
  ContactFormTextInput,
} from "@/components/ui/contact-form-control";
import { RadixThemePilot } from "@/components/ui/radix-theme";

describe("Contact form Radix text controls", () => {
  it("preserves native text input attributes used by the Contact form", () => {
    render(
      <RadixThemePilot>
        <ContactFormTextInput
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          required
          disabled
          aria-describedby="email-error"
        />
      </RadixThemePilot>,
    );

    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("inputmode", "email");
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("preserves native textarea attributes used by the Contact form", () => {
    render(
      <RadixThemePilot>
        <ContactFormTextarea
          id="message"
          name="message"
          placeholder="Message"
          rows={4}
          required
          disabled
          aria-describedby="message-error"
        />
      </RadixThemePilot>,
    );

    const textarea = screen.getByPlaceholderText("Message");
    expect(textarea).toHaveAttribute("id", "message");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("aria-describedby", "message-error");
  });

  it("keeps Radix-backed controls in native FormData submission", async () => {
    const user = userEvent.setup();
    render(
      <RadixThemePilot>
        <form aria-label="Contact form">
          <ContactFormTextInput
            id="email"
            name="email"
            type="email"
            placeholder="Email"
          />
          <ContactFormTextarea
            id="message"
            name="message"
            placeholder="Message"
          />
        </form>
      </RadixThemePilot>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "buyer@example.com");
    await user.type(screen.getByPlaceholderText("Message"), "Need a quote");

    const form = screen.getByRole("form", {
      name: "Contact form",
    }) as HTMLFormElement;
    const formData = new FormData(form);

    expect(formData.get("email")).toBe("buyer@example.com");
    expect(formData.get("message")).toBe("Need a quote");
  });
});
