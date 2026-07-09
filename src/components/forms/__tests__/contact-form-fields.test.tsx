import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormFields } from "../contact-form-fields";

// Mock translation function
const mockT = vi.fn((key: string) => key);

// React 19 Native Form Props for testing
const defaultProps = {
  t: mockT,
  isPending: false,
};

describe("Contact Form Fields - React 19 Native Form Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps FormFields as the only public contact-form-fields export", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/forms/contact-form-fields.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/export \{ AdditionalFields \}/);
    expect(source).not.toMatch(/export \{ CheckboxFields \}/);
    expect(source).not.toMatch(/export \{ ContactFields \}/);
    expect(source).not.toMatch(/export \{ NameFields \}/);
  });

  describe("FormFields Component", () => {
    it("renders optional markers for optional configured fields", () => {
      render(<FormFields {...defaultProps} />);

      expect(screen.getAllByText("optional").length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/company/i)).not.toHaveAttribute("required");
    });

    it("keeps translated placeholders on configured fields", () => {
      render(<FormFields {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        "placeholder",
        "emailPlaceholder",
      );
      expect(screen.getByLabelText(/message/i)).toHaveAttribute(
        "placeholder",
        "messagePlaceholder",
      );
    });

    it("keeps configured text field native attributes during the Radix controls pilot", () => {
      render(<FormFields {...defaultProps} />);

      expect(screen.getByLabelText(/fullName/i)).toHaveAttribute(
        "autocomplete",
        "name",
      );
      expect(screen.getByLabelText(/fullName/i)).toHaveAttribute(
        "autocapitalize",
        "words",
      );

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(emailInput).toHaveAttribute("inputmode", "email");
      expect(emailInput).toHaveAttribute("spellcheck", "false");
      expect(emailInput).toHaveAttribute("autocapitalize", "none");

      expect(screen.getByLabelText(/company/i)).toHaveAttribute(
        "autocomplete",
        "organization",
      );
      expect(screen.getByLabelText(/company/i)).toHaveAttribute(
        "autocapitalize",
        "words",
      );

      expect(screen.getByLabelText(/subject/i)).toHaveAttribute(
        "autocomplete",
        "off",
      );
      expect(screen.getByLabelText(/subject/i)).toHaveAttribute(
        "autocapitalize",
        "sentences",
      );

      expect(screen.getByLabelText(/message/i)).toHaveAttribute(
        "autocomplete",
        "off",
      );
      expect(screen.getByLabelText(/message/i)).toHaveAttribute(
        "spellcheck",
        "true",
      );
    });

    it("keeps configured checkboxes native and accessible during the text-control pilot", async () => {
      const user = userEvent.setup();
      render(<FormFields {...defaultProps} />);

      const privacyCheckbox = screen.getByRole("checkbox", {
        name: /acceptPrivacy/i,
      });
      const marketingCheckbox = screen.getByRole("checkbox", {
        name: /marketingConsent/i,
      });

      expect(privacyCheckbox).toHaveAttribute("type", "checkbox");
      expect(privacyCheckbox).toHaveAttribute("name", "acceptPrivacy");
      expect(privacyCheckbox).toBeRequired();
      expect(marketingCheckbox).toHaveAttribute("type", "checkbox");
      expect(marketingCheckbox).toHaveAttribute("name", "marketingConsent");
      expect(marketingCheckbox).not.toBeRequired();

      await user.click(privacyCheckbox);
      await user.click(marketingCheckbox);

      expect(privacyCheckbox).toBeChecked();
      expect(marketingCheckbox).toBeChecked();
    });

    it("keeps checkbox labels clickable during the text-control pilot", async () => {
      const user = userEvent.setup();
      render(<FormFields {...defaultProps} />);

      const privacyCheckbox = screen.getByRole("checkbox", {
        name: /acceptPrivacy/i,
      });
      const marketingCheckbox = screen.getByRole("checkbox", {
        name: /marketingConsent/i,
      });

      await user.click(screen.getByText("acceptPrivacy"));
      await user.click(screen.getByText("marketingConsent"));

      expect(privacyCheckbox).toBeChecked();
      expect(marketingCheckbox).toBeChecked();
    });
  });
});
