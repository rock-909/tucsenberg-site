import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactFormShell } from "@/components/ui/contact-form-shell";

describe("ContactFormShell", () => {
  it("renders children inside the Radix pilot boundary", () => {
    render(
      <ContactFormShell>
        <form aria-label="Contact form">Form content</form>
      </ContactFormShell>,
    );

    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-contact-form",
    );
    expect(screen.getByTestId("contact-form-shell")).toBeInTheDocument();
  });

  it("keeps caller-provided layout classes on the shell surface", () => {
    render(
      <ContactFormShell className="max-w-xl">
        <div>Content</div>
      </ContactFormShell>,
    );

    expect(screen.getByTestId("contact-form-shell")).toHaveClass("max-w-xl");
  });
});
