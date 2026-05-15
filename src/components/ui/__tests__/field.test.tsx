import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  ErrorSummary,
  Field,
  FieldControl,
  FieldError,
  FieldHint,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

describe("Field", () => {
  it("composes label, control, hint, and error slots", () => {
    render(
      <Field data-testid="field">
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldControl>
          <Input id="email" aria-describedby="email-hint email-error" />
        </FieldControl>
        <FieldHint id="email-hint">Use business email.</FieldHint>
        <FieldError id="email-error">Email is required.</FieldError>
      </Field>,
    );

    expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "field");
    expect(screen.getByText("Email")).toHaveAttribute(
      "data-slot",
      "field-label",
    );
    expect(screen.getByText("Use business email.")).toHaveAttribute(
      "data-slot",
      "field-hint",
    );
    expect(screen.getByText("Email is required.")).toHaveAttribute(
      "data-slot",
      "field-error",
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-describedby",
      "email-hint email-error",
    );
  });

  it("renders an accessible error summary", () => {
    render(
      <ErrorSummary tabIndex={-1} data-testid="summary">
        There was a problem
      </ErrorSummary>,
    );

    const summary = screen.getByTestId("summary");
    expect(summary).toHaveAttribute("data-slot", "error-summary");
    expect(summary).toHaveAttribute("role", "alert");
    expect(summary).toHaveAttribute("aria-live", "assertive");
    expect(summary).toHaveAttribute("tabindex", "-1");
  });

  it("forwards the error summary ref for focus management", () => {
    const summaryRef = createRef<HTMLDivElement>();

    render(<ErrorSummary ref={summaryRef}>There was a problem</ErrorSummary>);

    expect(summaryRef.current).toBeInstanceOf(HTMLDivElement);
    expect(summaryRef.current).toHaveAttribute("data-slot", "error-summary");
  });
});
