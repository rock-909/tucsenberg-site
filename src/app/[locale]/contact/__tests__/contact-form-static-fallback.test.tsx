import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { ContactFormStaticFallback } from "@/app/[locale]/contact/contact-form-static-fallback";
import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";

const enMessages = getComposedMessages("en");

const messages = {
  contact: {
    form: {
      title: "Contact form",
      fullName: "Full name",
      email: "Email",
      company: "Company Name",
      subject: "Subject",
      optional: "optional",
      message: "Message",
      privacyNotice:
        "By submitting, you agree to our privacy policy. We use your details only to respond to your enquiry.",
      submit: "Submit",
      turnstilePending:
        "Security verification is loading. You can send the form once it is ready.",
    },
  },
};

describe("ContactFormStaticFallback", () => {
  const actualLocaleMessages = [
    {
      locale: "en",
      messages: enMessages,
      fullNameLabel: "Full name",
      optionalLabel: "optional",
      submitLabel: "Send Enquiry",
    },
  ] as const;

  it("renders a disabled progressive-enhancement form shell before the client island loads", () => {
    render(<ContactFormStaticFallback messages={messages} />);

    const fallback = document.querySelector(
      '[data-contact-form-fallback="static"]',
    );

    expect(fallback).toBeInTheDocument();
    expect(fallback?.tagName).toBe("FORM");
    expect(fallback?.closest('[data-slot="card"]')).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-2xl",
    );
    expect(screen.getByLabelText("Full name")).toBeDisabled();
    expect(screen.getByLabelText("Full name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText(/Company Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/Company Name/i)).not.toBeRequired();
    expect(screen.getByLabelText("Message")).toBeDisabled();
    expect(
      document.querySelector('[data-contact-form-field-optional="company"]'),
    ).toHaveTextContent("optional");
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByTestId("form-privacy-notice")).toHaveTextContent(
      messages.contact.form.privacyNotice,
    );
  });

  it("keeps the static honeypot hidden and serialized while explaining the disabled security gate", () => {
    const { container } = render(
      <ContactFormStaticFallback messages={messages} />,
    );
    const form = container.querySelector("form");
    const honeypot = container.querySelector<HTMLInputElement>(
      'input[name="website"]',
    );

    if (!form || !honeypot) {
      throw new Error("Expected the static form and website honeypot.");
    }

    expect(honeypot).toHaveAttribute("id", "website");
    expect(honeypot).toHaveAttribute("type", "hidden");
    expect(honeypot).toHaveAttribute("hidden");
    expect(honeypot).not.toHaveClass("sr-only");
    expect(
      screen.queryByRole("textbox", { name: /website/i }),
    ).not.toBeInTheDocument();

    honeypot.value = "bot-filled";
    expect(new FormData(form).get("website")).toBe("bot-filled");
    expect(
      screen.getByText(
        "Security verification is loading. You can send the form once it is ready.",
      ),
    ).toBeInTheDocument();
  });

  it("protects fallback labels at the leaf level", () => {
    render(<ContactFormStaticFallback messages={messages} />);

    const fullNameLabel = screen.getByText("Full name");

    expect(fullNameLabel).toHaveAttribute("translate", "no");
  });

  it.each(actualLocaleMessages)(
    "uses actual $locale fallback copy and shows company as optional",
    ({
      messages: localeMessages,
      fullNameLabel,
      optionalLabel,
      submitLabel,
    }) => {
      render(<ContactFormStaticFallback messages={localeMessages} />);

      expect(screen.getByLabelText(fullNameLabel)).toBeDisabled();
      expect(
        document.querySelector('[data-contact-form-field-optional="company"]'),
      ).toHaveTextContent(optionalLabel);
      expect(screen.getByRole("button", { name: submitLabel })).toBeDisabled();
      expect(
        screen.getByText(
          readRequiredMessagePath(localeMessages, [
            "contact",
            "form",
            "turnstilePending",
          ]),
        ),
      ).toBeInTheDocument();
    },
  );

  it("fails fast when required fallback copy is missing", () => {
    expect(() =>
      ContactFormStaticFallback({ messages: { contact: { form: {} } } }),
    ).toThrow("Missing required message: contact.form.optional");
  });
});
