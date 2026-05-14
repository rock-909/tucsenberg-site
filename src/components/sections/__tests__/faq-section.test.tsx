import { readFileSync } from "node:fs";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      faq: {
        sectionTitle: "Frequently Asked Questions",
        items: {
          moq: {
            question: "What is the minimum order quantity (MOQ)?",
            answer: "Our MOQ is typically 500 to 1,000 pieces.",
          },
          leadTime: {
            question: "What is the lead time?",
            answer: "15 to 30 days.",
          },
        },
      },
    }),
  ),
}));

vi.mock("@/lib/content/mdx-faq", () => ({
  generateFaqSchemaFromItems: vi.fn(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [],
  })),
}));

vi.mock("@/components/seo", () => ({
  JsonLdScript: ({ data }: { data: unknown }) =>
    React.createElement("script", {
      "data-testid": "faq-schema",
      type: "application/ld+json",
      dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
    }),
}));

describe("Feature: FaqSection Reusable Component", () => {
  describe("Scenario 0: performance boundary", () => {
    it("keeps the FAQ accordion out of the client JavaScript bundle", () => {
      const source = readFileSync(
        "src/components/sections/faq-accordion.tsx",
        "utf8",
      );

      expect(source).not.toContain('"use client"');
      expect(source).not.toContain("@/components/ui/accordion");
      expect(source).not.toContain("lucide-react");
    });
  });

  async function renderFaqSection(
    props?: Partial<{
      items: string[];
      faqItems: Array<{ id: string; question: string; answer: string }>;
      title: string;
      locale: "en" | "zh";
    }>,
  ) {
    const { FaqSection } = await import("@/components/sections/faq-section");
    const baseProps = {
      title: props?.title ?? "Frequently Asked Questions",
      locale: props?.locale ?? "en",
    } as const;
    const element =
      props?.faqItems !== undefined
        ? await FaqSection({ ...baseProps, faqItems: props.faqItems })
        : await FaqSection({
            ...baseProps,
            items: props?.items ?? ["moq", "leadTime"],
          });
    return render(element);
  }

  describe("Scenario 1.1: renders title via SectionHead", () => {
    it("displays the section title", async () => {
      await renderFaqSection();
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        "Frequently Asked Questions",
      );
    });

    it("has a section-divider border at the top", async () => {
      const { container } = await renderFaqSection();
      const section = container.querySelector("section");
      expect(section?.className).toContain("section-divider");
    });
  });

  describe("Scenario 1.2: renders accordion items from translation keys", () => {
    it("renders the correct number of accordion items", async () => {
      const { container } = await renderFaqSection({
        items: ["moq", "leadTime"],
      });

      expect(container.querySelectorAll("summary")).toHaveLength(2);
    });

    it("displays question text for each item", async () => {
      await renderFaqSection({ items: ["moq"] });
      expect(
        screen.getByText("What is the minimum order quantity (MOQ)?"),
      ).toBeInTheDocument();
    });

    it("marks question labels without blocking answer translation", async () => {
      await renderFaqSection({ items: ["moq"] });

      expect(screen.getByTestId("faq-question-moq")).toHaveAttribute(
        "translate",
        "no",
      );
      await userEvent.click(screen.getByText(/minimum order quantity/i));
      expect(screen.getByTestId("faq-answer-moq")).not.toHaveAttribute(
        "translate",
      );
    });
  });

  describe("Scenario 1.3: Buyer expands a question", () => {
    it("expands answer when question is clicked", async () => {
      await renderFaqSection({ items: ["moq"] });
      const trigger = screen.getByText(
        "What is the minimum order quantity (MOQ)?",
      );
      await userEvent.click(trigger);
      expect(screen.getByText(/500 to 1,000 pieces/)).toBeVisible();
    });
  });

  describe("Scenario 1.2b: renders accordion items from direct FAQ items", () => {
    it("renders direct MDX-sourced FAQ items", async () => {
      await renderFaqSection({
        faqItems: [
          {
            id: "project-fit",
            question: "Can this page support service questions?",
            answer: "Yes, adapt the answer to the project-specific next step.",
          },
        ],
      });

      expect(
        screen.getByText("Can this page support service questions?"),
      ).toBeInTheDocument();
      await userEvent.click(
        screen.getByText("Can this page support service questions?"),
      );
      expect(screen.getByText(/project-specific next step/i)).toBeVisible();
    });
  });

  describe("Scenario 1.4: Multiple questions open simultaneously", () => {
    it("keeps both questions expanded", async () => {
      await renderFaqSection({ items: ["moq", "leadTime"] });
      await userEvent.click(
        screen.getByText("What is the minimum order quantity (MOQ)?"),
      );
      await userEvent.click(screen.getByText("What is the lead time?"));
      expect(screen.getByText(/500 to 1,000 pieces/)).toBeVisible();
      expect(screen.getByText(/15 to 30 days/)).toBeVisible();
    });
  });

  describe("Scenario 1.5: Keyboard navigation", () => {
    it("uses a native summary trigger for keyboard-accessible toggling", async () => {
      await renderFaqSection({ items: ["moq"] });
      const trigger = screen
        .getByText("What is the minimum order quantity (MOQ)?")
        .closest("summary");

      expect(trigger).toBeInstanceOf(HTMLElement);
      expect(trigger).toHaveTextContent(
        "What is the minimum order quantity (MOQ)?",
      );
    });
  });

  describe("Scenario 1.6: generates FAQ Schema", () => {
    it("renders JSON-LD script with FAQPage schema", async () => {
      await renderFaqSection();
      const script = screen.getByTestId("faq-schema");
      expect(script).toBeInTheDocument();
      const data = JSON.parse(script.innerHTML);
      expect(data["@type"]).toBe("FAQPage");
    });
  });

  describe("Scenario 5.1/5.2: i18n locale rendering", () => {
    it("renders content from translation keys (locale-agnostic at component level)", async () => {
      await renderFaqSection({ items: ["moq"] });
      expect(
        screen.getByText("Frequently Asked Questions"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("What is the minimum order quantity (MOQ)?"),
      ).toBeInTheDocument();
    });
  });
});
