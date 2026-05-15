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

vi.mock("@/lib/content/render-legal-content", () => ({
  renderLegalContent: (content: string) => (
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
    expect(
      within(fallback).getByRole("form", { name: "Contact Us" }),
    ).toBeInTheDocument();
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

  it("renders the Tucsenberg placeholder email while suppressing fake starter contact details", async () => {
    const { ContactMethodsCard } = await import("../contact-page-sections");

    render(
      <ContactMethodsCard
        copy={{
          title: "Contact Methods",
          emailLabel: "Email",
          emailUnavailable: "Use the form on this page.",
          phoneLabel: "Phone",
        }}
      />,
    );

    expect(screen.queryByText("sales@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("contact@tucsenberg.com")).toBeInTheDocument();
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

    expect(enMetadata.title).toBe("Contact | Showcase Website Starter");
    expect(enMetadata.description).toBe(
      "Use this starter contact page as a quick action for inquiries, demo requests, or launch questions before connecting a real receiver.",
    );
    expect(zhMetadata.title).toBe("联系 | Showcase Website Starter");
    expect(zhMetadata.description).toBe(
      "这个 starter 联系页可作为询盘、演示预约或上线问题的快速入口；正式上线前请接入真实接收方。",
    );
    expect(enMetadata.other?.google).not.toBe("notranslate");
    expect(zhMetadata.other?.google).not.toBe("notranslate");
  });
});
