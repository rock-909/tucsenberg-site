import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import enCriticalMessages from "../../../../../messages/en/critical.json";
import enDeferredMessages from "../../../../../messages/en/deferred.json";
import zhCriticalMessages from "../../../../../messages/zh/critical.json";
import zhDeferredMessages from "../../../../../messages/zh/deferred.json";
import { ContactFormStaticFallback } from "@/app/[locale]/contact/contact-form-static-fallback";

const messages = {
  contact: {
    form: {
      title: "Contact form",
      fullName: "Full name",
      email: "Email",
      company: "Company Name",
      optional: "optional",
      message: "Message",
      acceptPrivacy: "I agree to the privacy policy",
      submit: "Submit",
    },
  },
};

describe("ContactFormStaticFallback", () => {
  const actualLocaleMessages = [
    {
      locale: "en",
      messages: { ...enCriticalMessages, ...enDeferredMessages },
      fullNameLabel: "Full name",
      optionalLabel: "optional",
      submitLabel: "Send Message",
    },
    {
      locale: "zh",
      messages: { ...zhCriticalMessages, ...zhDeferredMessages },
      fullNameLabel: "姓名",
      optionalLabel: "选填",
      submitLabel: "发送消息",
    },
  ] as const;

  it("renders a disabled static form while the streamed Contact form loads", () => {
    render(<ContactFormStaticFallback messages={messages} />);

    const form = document.querySelector(
      '[data-contact-form-fallback="static"]',
    );

    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Full name")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    const companyInput = document.querySelector('input[name="company"]');
    expect(companyInput).toBeDisabled();
    expect(companyInput).not.toHaveAttribute("required");
    expect(screen.getByText("optional")).toHaveAttribute(
      "data-contact-form-field-optional",
      "company",
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("protects fallback labels and submit copy at the leaf level", () => {
    render(<ContactFormStaticFallback messages={messages} />);

    const fullNameLabel = screen.getByText("Full name");
    const submitLabel = screen.getByText("Submit");

    expect(fullNameLabel).toHaveAttribute("translate", "no");
    expect(submitLabel).toHaveAttribute("translate", "no");
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
      expect(screen.getByText(optionalLabel)).toHaveAttribute(
        "data-contact-form-field-optional",
        "company",
      );
      expect(screen.getByLabelText(fullNameLabel)).toHaveAttribute("required");
      expect(screen.getByText(optionalLabel).closest("label")).toHaveAttribute(
        "for",
        "company",
      );
      expect(screen.getByRole("button", { name: submitLabel })).toBeDisabled();
    },
  );

  it("fails fast when required fallback copy is missing", () => {
    expect(() =>
      render(
        <ContactFormStaticFallback messages={{ contact: { form: {} } }} />,
      ),
    ).toThrow("Missing required message: contact.form.title");
  });
});
