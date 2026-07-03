import React from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setRequestLocale } from "next-intl/server";
import ContactPage, { generateMetadata } from "@/app/[locale]/contact/page";
import { renderAsyncPage } from "@/test/render-async-page";

const { mockGetContactCopyFromMessages } = vi.hoisted(() => ({
  mockGetContactCopyFromMessages: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof React>("react");

  return {
    ...actual,
    Suspense: ({
      children,
      fallback,
    }: {
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }) => (
      <section data-testid="suspense-boundary">
        {fallback ? (
          <div data-testid="suspense-fallback">{fallback}</div>
        ) : null}
        {children}
      </section>
    ),
  };
});

const contactCopy = {
  header: {
    title: "Legacy Contact",
    description: "Legacy description",
  },
  panel: {
    contact: {
      title: "Contact Methods",
      emailLabel: "Email",
      phoneLabel: "Phone",
    },
    response: {
      title: "Response Time",
      responseTimeLabel: "Response",
      responseTimeValue: "Within 24 hours",
      bestForLabel: "Best for",
      bestForValue: "Quotes",
      prepareLabel: "Prepare",
      prepareValue: "Product specs",
    },
    hours: {
      title: "Business Hours",
      weekdaysLabel: "Weekdays",
      saturdayLabel: "Saturday",
      sundayLabel: "Sunday",
      closedLabel: "Closed",
    },
  },
};

vi.mock("@/components/contact/contact-form-island", () => ({
  ContactFormIsland: ({ fallback }: { fallback: React.ReactNode }) => (
    <section data-testid="contact-form-island">
      {fallback}
      <div data-testid="contact-form">Contact Form</div>
    </section>
  ),
}));

vi.mock("@/components/sections/faq-section", () => ({
  FaqSection: ({
    faqItems,
  }: {
    faqItems: Array<{ id: string; question: string }>;
  }) => (
    <section data-testid="faq-section">
      {faqItems.map((item) => (
        <div key={item.id}>{item.question}</div>
      ))}
    </section>
  ),
}));

vi.mock("@/lib/content/render-static-markdown-content", () => ({
  createStaticMarkdownContent: (content: string) => (
    <div data-testid="mdx-body">{content}</div>
  ),
}));

vi.mock("@/lib/contact/getContactCopy", () => ({
  getContactCopyFromMessages: mockGetContactCopyFromMessages,
}));

describe("ContactPage MDX migration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContactCopyFromMessages.mockReturnValue(contactCopy);
  });

  it("renders hero and body from MDX while keeping the form", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const content = await screen.findByTestId("contact-page-content");

    expect(
      within(content).getByRole("heading", { level: 1 }),
    ).toHaveTextContent("Contact Us");
    expect(screen.getByTestId("mdx-body")).toBeInTheDocument();
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("keeps the static Suspense fallback scoped to the form column", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const fallback = screen.getByTestId("suspense-fallback");

    expect(fallback).toBeInTheDocument();
    const staticForm = fallback.querySelector(
      '[data-contact-form-fallback="static"]',
    );
    expect(staticForm).not.toBeNull();
    expect(staticForm?.tagName).toBe("FORM");
    expect(
      within(fallback).getByRole("button", { name: /send message/i }),
    ).toBeDisabled();
    expect(
      screen.queryByTestId("contact-page-fallback"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("contact-page-content")).toBeInTheDocument();
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("sets the request locale in the page entry before rendering contact content", async () => {
    await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith("en");
  });

  it("renders localized contact panel copy from the top-level contact namespace", async () => {
    const actualContactCopy = await vi.importActual<
      typeof import("@/lib/contact/getContactCopy")
    >("@/lib/contact/getContactCopy");
    mockGetContactCopyFromMessages.mockImplementation(
      actualContactCopy.getContactCopyFromMessages,
    );

    const page = await ContactPage({
      params: Promise.resolve({ locale: "zh" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(
      screen.getByRole("heading", { name: "联系方式" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "联系后会发生什么" }),
    ).toBeInTheDocument();
    expect(screen.getByText("工作日 24 小时内")).toBeInTheDocument();
    expect(screen.getByText("建议提供")).toBeInTheDocument();
  });

  it("does not render placeholder contact details while public contact facts are not configured", async () => {
    const { ContactMethodsCard } = await import("../contact-page-sections");

    render(
      <ContactMethodsCard
        copy={{
          title: "Contact Methods",
          emailLabel: "Email",
          emailUnavailable:
            "Use the form on this page; configure a real receiver before public launch.",
          phoneLabel: "Phone",
        }}
      />,
    );

    expect(screen.queryByText("sales@example.com")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Use the form on this page; configure a real receiver before public launch.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("+86-518-0000-0000")).not.toBeInTheDocument();
    expect(screen.queryByText("Phone")).not.toBeInTheDocument();
  });

  it("renders FAQ from MDX frontmatter", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(await screen.findByTestId("faq-section")).toHaveTextContent(
      "How fast should a real site respond?",
    );
  });

  it("renders the starter inquiry handoff before the form", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const handoff = screen.getByTestId("contact-inquiry-handoff");
    const formColumn = screen.getByTestId("contact-form-column");

    expect(
      within(handoff).getByRole("heading", {
        level: 2,
        name: "Before you submit",
      }),
    ).toBeInTheDocument();
    expect(handoff).toHaveTextContent(
      "Use this page when you are ready to ask for confirmation",
    );
    expect(handoff).not.toHaveTextContent("Products, Resources, or Blog");
    expect(handoff).toHaveTextContent("What you need");
    expect(handoff).toHaveTextContent("Useful context");
    expect(handoff).toHaveTextContent("Decision timing");
    expect(formColumn.compareDocumentPosition(handoff)).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it("keeps the form as the main action with response expectations beside it", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    // h1 contact/inquiry heading.
    expect(
      screen.getByRole("heading", { level: 1, name: /contact|inquiry/i }),
    ).toBeInTheDocument();

    // The form is present (existing stable contact-form locator: the live form
    // exposes no `form` role in this harness, so reuse the testid the other
    // contact tests already rely on without changing form behavior).
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();

    // Confidence (response expectations) sits in the column beside the form,
    // and leads with the response/expect/prepare copy rather than the
    // contact-methods fallback.
    const confidenceColumn = screen.getByTestId("contact-confidence-column");
    const formColumn = screen.getByTestId("contact-form-column");

    // Response / expect / prepare confidence copy the page actually renders
    // from existing contact panel content, scoped to the confidence column.
    expect(
      within(confidenceColumn).getAllByText(
        /response|handoff|expect|prepare|回复|准备/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      within(confidenceColumn).getByText("Within 24 hours"),
    ).toBeInTheDocument();
    expect(
      within(confidenceColumn).getByText("Product specs"),
    ).toBeInTheDocument();
    expect(confidenceColumn).not.toContainElement(
      screen.getByTestId("contact-form"),
    );
    expect(formColumn.compareDocumentPosition(confidenceColumn)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps the inquiry handoff as static guidance without extra routes or downloads", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const handoff = screen.getByTestId("contact-inquiry-handoff");

    expect(within(handoff).queryByRole("link")).not.toBeInTheDocument();
    expect(handoff.textContent).not.toContain(".pdf");
    expect(handoff.textContent).not.toContain("/api/");
    expect(handoff.textContent).not.toContain("login");
  });

  it("renders validated product family context from Contact query params", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        intent: "product-family",
        market: "north-america",
        family: "couplings",
      }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(screen.getByText("You are asking about:")).toBeInTheDocument();
    expect(screen.getByText(/Primary Offer Example/)).toBeInTheDocument();
    expect(screen.getByText(/Support Packages/)).toBeInTheDocument();
  });

  it("ignores invalid product family context without rendering raw query text", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        intent: "product-family",
        market: "north-america",
        family: "<script>alert(1)</script>",
      }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(screen.queryByText("You are asking about:")).not.toBeInTheDocument();
    expect(
      screen.queryByText("<script>alert(1)</script>"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });

  it("keeps the product family notice in the same left column as the form", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        intent: "product-family",
        market: "north-america",
        family: "couplings",
      }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const formColumn = screen.getByTestId("contact-form-column");
    expect(formColumn).toContainElement(
      screen.getByTestId("product-family-context-notice"),
    );
    expect(formColumn).toContainElement(screen.getByTestId("contact-form"));
  });

  it("does not protect the entire Contact page from browser translation", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);
    const shell = screen.getByTestId("contact-page-content");

    expect(shell).not.toHaveClass("notranslate");
    expect(shell).not.toHaveAttribute("translate", "no");
  });

  it("builds contact metadata from the static content manifest", async () => {
    const enMetadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });
    const zhMetadata = await generateMetadata({
      params: Promise.resolve({ locale: "zh" }),
    });

    expect(enMetadata.title).toBe("Contact");
    expect(enMetadata.description).toBe(
      "Use this starter contact page as a quick action for inquiries, demo requests, or launch questions before connecting a real receiver.",
    );
    expect(zhMetadata.title).toBe("联系");
    expect(zhMetadata.description).toBe(
      "这个 starter 联系页可作为询盘、演示预约或上线问题的快速入口；正式上线前请接入真实接收方。",
    );
    expect(enMetadata.other?.google).not.toBe("notranslate");
    expect(zhMetadata.other?.google).not.toBe("notranslate");
  });

  it("generates runtime SEO metadata for the actual localized contact route", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "zh" }),
    });

    expect(metadata.alternates).toEqual(
      expect.objectContaining({
        canonical: "https://example.com/zh/contact",
        languages: expect.objectContaining({
          en: "https://example.com/en/contact",
          zh: "https://example.com/zh/contact",
          "x-default": "https://example.com/en/contact",
        }),
      }),
    );
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        url: "https://example.com/zh/contact",
        locale: "zh",
        type: "website",
      }),
    );
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        title: "联系",
      }),
    );
    expect(metadata.robots).toEqual(
      expect.objectContaining({
        index: true,
        follow: true,
      }),
    );
  });
});
