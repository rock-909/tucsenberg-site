import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CheckboxFields } from "@/components/forms/fields/checkbox-fields";

const labels = {
  acceptPrivacy: "I accept the privacy policy",
  marketingConsent: "Send me occasional product updates",
} as const;

function t(key: string): string {
  return labels[key as keyof typeof labels] ?? key;
}

function renderCheckboxForm(isPending = false) {
  return render(
    <form data-testid="form">
      <CheckboxFields t={t} isPending={isPending} />
    </form>,
  );
}

describe("CheckboxFields native checkbox proof", () => {
  it("keeps privacy checkbox required and marketing checkbox optional", () => {
    renderCheckboxForm();

    const privacy = screen.getByRole("checkbox", {
      name: labels.acceptPrivacy,
    });
    const marketing = screen.getByRole("checkbox", {
      name: labels.marketingConsent,
    });

    expect(privacy).toHaveAttribute("name", "acceptPrivacy");
    expect(privacy).toHaveAttribute("type", "checkbox");
    expect(privacy).toBeRequired();
    expect(marketing).toHaveAttribute("name", "marketingConsent");
    expect(marketing).toHaveAttribute("type", "checkbox");
    expect(marketing).not.toBeRequired();
  });

  it("submits checked checkbox values through native FormData", async () => {
    const user = userEvent.setup();
    renderCheckboxForm();

    const privacy = screen.getByRole("checkbox", {
      name: labels.acceptPrivacy,
    });
    const marketing = screen.getByRole("checkbox", {
      name: labels.marketingConsent,
    });

    await user.click(privacy);
    await user.click(marketing);

    const form = screen.getByTestId("form") as HTMLFormElement;
    const formData = new FormData(form);

    expect(formData.get("acceptPrivacy")).toBe("on");
    expect(formData.get("marketingConsent")).toBe("on");
  });

  it("omits unchecked optional checkbox values from native FormData", async () => {
    const user = userEvent.setup();
    renderCheckboxForm();

    await user.click(
      screen.getByRole("checkbox", {
        name: labels.acceptPrivacy,
      }),
    );

    const form = screen.getByTestId("form") as HTMLFormElement;
    const formData = new FormData(form);

    expect(formData.get("acceptPrivacy")).toBe("on");
    expect(formData.has("marketingConsent")).toBe(false);
  });

  it("toggles checkboxes by clicking their labels", async () => {
    const user = userEvent.setup();
    renderCheckboxForm();

    const privacy = screen.getByRole("checkbox", {
      name: labels.acceptPrivacy,
    });
    const marketing = screen.getByRole("checkbox", {
      name: labels.marketingConsent,
    });

    await user.click(screen.getByText(labels.acceptPrivacy));
    await user.click(screen.getByText(labels.marketingConsent));

    expect(privacy).toBeChecked();
    expect(marketing).toBeChecked();
  });

  it("keeps pending checkboxes disabled", () => {
    renderCheckboxForm(true);

    expect(
      screen.getByRole("checkbox", { name: labels.acceptPrivacy }),
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: labels.marketingConsent }),
    ).toBeDisabled();
  });
});
