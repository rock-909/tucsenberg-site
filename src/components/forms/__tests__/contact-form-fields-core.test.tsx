import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AdditionalFields,
  CheckboxFields,
  ContactFields,
  NameFields,
} from "../contact-form-fields";

// Mock translation function
const mockT = vi.fn((key: string) => key);

// React 19 Native Form Props for testing
const defaultProps = {
  t: mockT,
  isPending: false,
};

describe("Contact Form Fields - Core Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("NameFields Component", () => {
    it("should render one full name field instead of first and last name fields", () => {
      render(<NameFields {...defaultProps} />);

      expect(screen.getByLabelText(/fullName/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/firstName/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/lastName/i)).not.toBeInTheDocument();
    });

    it("should show required indicators", () => {
      render(<NameFields {...defaultProps} />);

      // Check for required asterisks (*) in labels
      const labels = screen.getAllByText(/fullName/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it("should have required attributes on the full name input", () => {
      render(<NameFields {...defaultProps} />);

      const fullNameInput = screen.getByLabelText(/fullName/i);

      expect(fullNameInput).toHaveAttribute("required");
      expect(fullNameInput).toHaveAttribute("name", "fullName");
      expect(fullNameInput).toHaveAttribute("autoComplete", "name");
    });

    it("should disable inputs when isPending is true", () => {
      render(<NameFields {...defaultProps} isPending={true} />);

      const fullNameInput = screen.getByLabelText(/fullName/i);

      expect(fullNameInput).toBeDisabled();
    });
  });

  describe("ContactFields Component", () => {
    it("should render email and company fields", () => {
      render(<ContactFields {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    });

    it("should show email as required", () => {
      render(<ContactFields {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("required");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/company/i)).not.toHaveAttribute("required");
    });

    it("should have correct input attributes", () => {
      render(<ContactFields {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const companyInput = screen.getByLabelText(/company/i);

      expect(emailInput).toHaveAttribute("name", "email");
      expect(companyInput).toHaveAttribute("name", "company");
    });

    it("should disable inputs when isPending is true", () => {
      render(<ContactFields {...defaultProps} isPending={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      const companyInput = screen.getByLabelText(/company/i);

      expect(emailInput).toBeDisabled();
      expect(companyInput).toBeDisabled();
    });
  });

  describe("CheckboxFields Component", () => {
    it("should render privacy policy checkbox", () => {
      render(<CheckboxFields {...defaultProps} />);

      expect(screen.getByLabelText(/acceptPrivacy/i)).toBeInTheDocument();
      expect(screen.getByText(/acceptPrivacy/i)).toBeInTheDocument();
    });

    it("should have required attribute on checkbox", () => {
      const { container } = render(
        <form>
          <CheckboxFields {...defaultProps} />
        </form>,
      );

      const checkbox = screen.getByLabelText(/acceptPrivacy/i);
      const formInput = container.querySelector('input[name="acceptPrivacy"]');

      expect(checkbox).toBeRequired();
      expect(checkbox).toHaveAttribute("data-slot", "checkbox");
      expect(formInput).toBeInstanceOf(HTMLInputElement);
      expect(formInput).toHaveAttribute("type", "checkbox");
      expect(formInput).toHaveAttribute("required");
    });

    it("should handle checkbox interactions", async () => {
      const user = userEvent.setup();
      render(<CheckboxFields {...defaultProps} />);

      const checkbox = screen.getByLabelText(/acceptPrivacy/i);
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it("should disable checkbox when isPending is true", () => {
      render(<CheckboxFields {...defaultProps} isPending={true} />);

      const checkbox = screen.getByLabelText(/acceptPrivacy/i);
      expect(checkbox).toBeDisabled();
    });
  });

  describe("AdditionalFields Component", () => {
    it("should render phone and subject fields", () => {
      render(<AdditionalFields {...defaultProps} />);

      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    });

    it("should have correct input attributes", () => {
      render(<AdditionalFields {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone/i);
      const subjectInput = screen.getByLabelText(/subject/i);

      expect(phoneInput).toHaveAttribute("name", "phone");
      expect(phoneInput).toHaveAttribute("type", "tel");
      expect(subjectInput).toHaveAttribute("name", "subject");
      expect(subjectInput).toHaveAttribute("type", "text");
    });

    it("should handle input interactions", async () => {
      const user = userEvent.setup();
      render(<AdditionalFields {...defaultProps} />);

      const phoneField = screen.getByLabelText(/phone/i);
      const subjectField = screen.getByLabelText(/subject/i);

      await user.type(phoneField, "+1234567890");
      await user.type(subjectField, "Test subject");

      expect(phoneField).toHaveValue("+1234567890");
      expect(subjectField).toHaveValue("Test subject");
    });

    it("should disable inputs when isPending is true", () => {
      render(<AdditionalFields {...defaultProps} isPending={true} />);

      const phoneInput = screen.getByLabelText(/phone/i);
      const subjectInput = screen.getByLabelText(/subject/i);

      expect(phoneInput).toBeDisabled();
      expect(subjectInput).toBeDisabled();
    });
  });

  describe("React 19 Native Form Integration", () => {
    it("should render all form fields with correct names", () => {
      const { container } = render(
        <form>
          <NameFields {...defaultProps} />
          <ContactFields {...defaultProps} />
          <CheckboxFields {...defaultProps} />
          <AdditionalFields {...defaultProps} />
        </form>,
      );

      // Verify all fields have correct name attributes for form submission
      expect(screen.getByLabelText(/fullName/i)).toHaveAttribute(
        "name",
        "fullName",
      );
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("name", "email");
      expect(screen.getByLabelText(/company/i)).toHaveAttribute(
        "name",
        "company",
      );
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute("name", "phone");
      expect(screen.getByLabelText(/subject/i)).toHaveAttribute(
        "name",
        "subject",
      );
      expect(
        container.querySelector('input[name="acceptPrivacy"]'),
      ).toBeInstanceOf(HTMLInputElement);
      expect(
        container.querySelector('input[name="marketingConsent"]'),
      ).toBeInstanceOf(HTMLInputElement);
    });

    it("should handle form submission state with isPending", () => {
      const pendingProps = {
        ...defaultProps,
        isPending: true,
      };

      render(
        <div>
          <NameFields {...pendingProps} />
          <ContactFields {...pendingProps} />
          <CheckboxFields {...pendingProps} />
          <AdditionalFields {...pendingProps} />
        </div>,
      );

      // All fields should be disabled during submission
      const inputs = screen.getAllByRole("textbox");
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });

      const checkbox = screen.getByLabelText(/acceptPrivacy/i);
      expect(checkbox).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(
        <div>
          <NameFields {...defaultProps} />
          <ContactFields {...defaultProps} />
          <CheckboxFields {...defaultProps} />
          <AdditionalFields {...defaultProps} />
        </div>,
      );

      // Check that all form fields have accessible labels
      expect(screen.getByLabelText(/fullName/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/acceptPrivacy/i)).toBeInTheDocument();
    });

    it("should have aria-describedby attributes for error handling", () => {
      render(
        <div>
          <NameFields {...defaultProps} />
          <ContactFields {...defaultProps} />
          <AdditionalFields {...defaultProps} />
        </div>,
      );

      const fullNameField = screen.getByLabelText(/fullName/i);
      const emailField = screen.getByLabelText(/email/i);
      const phoneField = screen.getByLabelText(/phone/i);

      // Fields should have aria-describedby for error messages
      expect(fullNameField).toHaveAttribute(
        "aria-describedby",
        "fullName-error",
      );
      expect(emailField).toHaveAttribute("aria-describedby", "email-error");
      expect(phoneField).toHaveAttribute("aria-describedby", "phone-error");
    });
  });

  describe("Translation Integration", () => {
    it("should call translation function for all labels", () => {
      render(
        <div>
          <NameFields {...defaultProps} />
          <ContactFields {...defaultProps} />
          <CheckboxFields {...defaultProps} />
          <AdditionalFields {...defaultProps} />
        </div>,
      );

      // Verify translation function was called for field labels
      expect(mockT).toHaveBeenCalledWith("fullName");
      expect(mockT).toHaveBeenCalledWith("email");
      expect(mockT).toHaveBeenCalledWith("company");
      expect(mockT).toHaveBeenCalledWith("phone");
      expect(mockT).toHaveBeenCalledWith("subject");
      expect(mockT).toHaveBeenCalledWith("acceptPrivacy");
      expect(mockT).toHaveBeenCalledWith("marketingConsent");
    });
  });
});
