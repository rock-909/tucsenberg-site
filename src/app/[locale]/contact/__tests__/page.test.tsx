import React from "react";
import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
      title: "Email & WhatsApp",
      emailLabel: "Email",
      phoneLabel: "Phone",
    },
    response: {
      title: "Quote response",
      responseTimeLabel: "Standard items",
      responseTimeValue: "12 hours",
      bestForLabel: "Custom configurations",
      bestForValue: "48 hours",
      prepareLabel: "Fastest route",
      prepareValue: "Use the RFQ form; it asks the questions we'd ask anyway.",
    },
    hours: {
      title: "Time zone",
      weekdaysLabel: "China",
      saturdayLabel: "Follow-up",
      sundayLabel: "US/EU hours",
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    ).toHaveTextContent("Contact");
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
      within(fallback).getByRole("button", { name: /send enquiry/i }),
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

  it("renders English contact panel copy from the top-level contact namespace", async () => {
    const actualContactCopy = await vi.importActual<
      typeof import("@/lib/contact/getContactCopy")
    >("@/lib/contact/getContactCopy");
    mockGetContactCopyFromMessages.mockImplementation(
      actualContactCopy.getContactCopyFromMessages,
    );

    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(
      screen.getByRole("heading", { name: "Email & RFQ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Email & WhatsApp/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Quote response" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Standard items")).toBeInTheDocument();
    expect(screen.getByText("12 hours")).toBeInTheDocument();
  });

  it("renders the public email and hides the owner TODO phone", async () => {
    const { ContactMethodsCard } = await import("../contact-page-sections");

    render(
      <ContactMethodsCard
        copy={{
          title: "Email & RFQ",
          emailLabel: "Email",
          emailUnavailable: "Use the RFQ form if email is unavailable.",
          phoneLabel: "Phone",
        }}
      />,
    );

    expect(screen.getByText("sales@tucsenberg.com")).toBeInTheDocument();
    expect(screen.queryByText("+86-518-0000-0000")).not.toBeInTheDocument();
    expect(screen.queryByText("TODO-OWNER")).not.toBeInTheDocument();
    expect(screen.queryByText("Phone")).not.toBeInTheDocument();
    expect(screen.queryByText(/WhatsApp/i)).not.toBeInTheDocument();
  });

  it("does not render starter FAQ from MDX frontmatter", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(screen.queryByTestId("faq-section")).not.toBeInTheDocument();
  });

  it("renders the Tucsenberg inquiry handoff before the form", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    const handoff = screen.getByTestId("contact-inquiry-handoff");
    const formColumn = screen.getByTestId("contact-form-column");

    expect(
      within(handoff).getByRole("heading", {
        level: 2,
        name: "Fastest route",
      }),
    ).toBeInTheDocument();
    expect(handoff).toHaveTextContent(
      "The RFQ form asks the questions we would ask anyway",
    );
    expect(handoff).not.toHaveTextContent("Products, Resources, or Blog");
    expect(handoff).toHaveTextContent("What you are protecting");
    expect(handoff).toHaveTextContent("Dimensions");
    expect(handoff).toHaveTextContent("Market and port");
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
      within(confidenceColumn).getAllByText(/standard|custom|quote/i).length,
    ).toBeGreaterThan(0);
    expect(within(confidenceColumn).getByText("12 hours")).toBeInTheDocument();
    expect(within(confidenceColumn).getByText("48 hours")).toBeInTheDocument();
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
        market: "abs-flood-barriers",
        family: "abs-boxwall",
      }),
    });

    await renderAsyncPage(page as React.JSX.Element);

    expect(screen.getByText("You are asking about:")).toBeInTheDocument();
    expect(
      screen.getByText(/ABS Interlocking Boxwall Flood Barriers/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ABS boxwall units/)).toBeInTheDocument();
  });

  it("ignores invalid product family context without rendering raw query text", async () => {
    const page = await ContactPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({
        intent: "product-family",
        market: "abs-flood-barriers",
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
        market: "abs-flood-barriers",
        family: "abs-boxwall",
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

    expect(enMetadata.title).toBe(
      "Contact Tucsenberg — Flood Barrier Supplier, China",
    );
    expect(enMetadata.description).toBe(
      "Fastest route: the RFQ form — it asks the questions we'd ask anyway, so your quote comes back faster.",
    );
    expect(enMetadata.other?.google).not.toBe("notranslate");
  });

  it("generates runtime SEO metadata for the actual localized contact route", async () => {
    vi.stubEnv("APP_ENV", "production");

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.alternates).toEqual(
      expect.objectContaining({
        canonical: "https://example.com/contact",
        languages: expect.objectContaining({
          en: "https://example.com/contact",
          "x-default": "https://example.com/contact",
        }),
      }),
    );
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        url: "https://example.com/contact",
        locale: "en",
        type: "website",
      }),
    );
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        title: "Contact Tucsenberg — Flood Barrier Supplier, China",
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
