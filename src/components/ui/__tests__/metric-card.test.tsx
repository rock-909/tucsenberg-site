import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "@/components/ui/metric-card";

describe("MetricCard", () => {
  it("renders a metric as a data-card-backed definition item", () => {
    render(
      <dl>
        <MetricCard
          label="Visits in the last 7 days"
          value="320"
          description="Cloudflare analytics"
        />
      </dl>,
    );

    const metric = screen.getByText("320").closest("[data-slot='data-card']");
    expect(metric).toHaveAttribute("data-ui-pilot", "radix-themes-data-card");
    expect(metric).toHaveAttribute("data-metric-card", "true");
    expect(screen.getByText("Visits in the last 7 days").tagName).toBe("DT");
    expect(screen.getByText("320").tagName).toBe("DD");
    expect(screen.getByText("Cloudflare analytics")).toHaveAttribute(
      "data-slot",
      "metric-card-description",
    );
  });

  it("keeps definition-list semantics by requiring a dl parent", () => {
    render(
      <dl data-testid="metrics">
        <MetricCard label="Requests" value="42" />
      </dl>,
    );

    const value = screen.getByText("42");
    expect(value.closest("dl")).toBe(screen.getByTestId("metrics"));
  });
});
