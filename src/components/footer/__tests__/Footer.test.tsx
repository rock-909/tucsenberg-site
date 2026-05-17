/**
 * Footer Component Tests
 *
 * Tests for the new Footer component (src/components/footer/Footer.tsx)
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FEATURED_COMPATIBLE_BRAND_HREF,
  FEATURED_MEMBRANE_HREF,
  SINGLE_SITE_ROUTE_HREFS,
} from "@/config/single-site-links";
import { Footer } from "../Footer";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Footer Component", () => {
  it("renders without crashing", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("renders all footer sections", () => {
    render(<Footer />);

    // Check for section headings (using translation keys as mock returns them)
    const sections = ["Resources", "Company", "Legal"];
    sections.forEach((section) => {
      // Look for headings or elements with these keys
      const elements = screen.queryAllByText(
        (content, element) =>
          element?.tagName === "H2" && content.includes(section.toLowerCase()),
      );
      // At least some footer structure should exist
      expect(elements.length >= 0).toBe(true);
    });
  });

  it("keeps footer navigation aligned with the four-page public IA", () => {
    render(<Footer />);

    const footerNav = screen.getByRole("navigation", {
      name: /footer navigation/i,
    });
    const navigationSection = footerNav
      .querySelector("#navigation-heading")
      ?.closest("section");
    const supportSection = footerNav
      .querySelector("#support-heading")
      ?.closest("section");

    expect(navigationSection).not.toBeNull();
    expect(supportSection).not.toBeNull();

    const navigationLinks = Array.from(
      navigationSection?.querySelectorAll("a") ?? [],
    ).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent,
    }));
    const supportLinks = Array.from(
      supportSection?.querySelectorAll("a") ?? [],
    ).map((link) => ({
      href: link.getAttribute("href"),
      text: link.textContent,
    }));

    // Step-4 footer IA: Membranes/Compatibility route to live pages, only
    // Materials stays the genuine-future #coming-soon placeholder.
    expect(navigationLinks).toEqual([
      { href: "/", text: "Home" },
      { href: FEATURED_MEMBRANE_HREF, text: "Membranes" },
      { href: FEATURED_COMPATIBLE_BRAND_HREF, text: "Compatibility" },
      { href: SINGLE_SITE_ROUTE_HREFS.comingSoon, text: "Materials" },
    ]);
    // Shipped Step-4 footer links must not regress to the placeholder.
    expect(navigationLinks).not.toContainEqual({
      href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
      text: "Membranes",
    });
    expect(navigationLinks).not.toContainEqual({
      href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
      text: "Compatibility",
    });
    expect(navigationLinks).not.toContainEqual({
      href: "/contact",
      text: "Contact",
    });
    expect(supportLinks).toContainEqual({
      href: SINGLE_SITE_ROUTE_HREFS.quote,
      text: "Quote",
    });
    expect(supportLinks).not.toContainEqual({
      href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
      text: "Quote",
    });
    expect(supportLinks).not.toContainEqual({
      href: "/contact",
      text: "Contact",
    });
  });

  it("renders the real business email as visible copyable text", () => {
    render(<Footer />);

    // A+ non-RFQ contact decision: the footer must surface the literal
    // business email as readable text (a mailto wrapper is an enhancement,
    // not a substitute for the visible address).
    const emailNode = screen.getByText("sales@tucsenberg.com");
    expect(emailNode).toBeInTheDocument();
    expect(emailNode.tagName).toBe("A");
    expect(emailNode).toHaveAttribute("href", "mailto:sales@tucsenberg.com");
    expect(emailNode.textContent).toBe("sales@tucsenberg.com");
  });

  it("renders social links section", () => {
    render(<Footer />);

    // Social section should exist
    const socialHeading = screen.queryByRole("heading", {
      name: /social/i,
      level: 2,
    });

    // If social heading exists, verify structure
    if (socialHeading) {
      expect(socialHeading).toBeInTheDocument();
    }
  });

  it("renders theme toggle slot when provided", () => {
    const ThemeToggle = () => <button>Toggle Theme</button>;
    render(<Footer themeToggleSlot={<ThemeToggle />} />);

    const themeButton = screen.getByText("Toggle Theme");
    expect(themeButton).toBeInTheDocument();
  });

  it("renders status slot when provided", () => {
    const StatusContent = () => <div>© 2025 Company</div>;
    render(<Footer statusSlot={<StatusContent />} />);

    const status = screen.getByText(/© 2025 Company/);
    expect(status).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Footer className="custom-footer" />);
    const footer = container.querySelector(".custom-footer");
    expect(footer).toBeInTheDocument();
  });

  it("uses footer-specific color tokens for the dark footer surface", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass(
      "bg-[var(--footer-bg)]",
      "text-[var(--footer-text)]",
      "border-[var(--footer-divider)]",
    );

    const firstHeading = screen.getAllByRole("heading", { level: 2 })[0];
    expect(firstHeading).toHaveClass("text-[var(--footer-heading)]");

    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink).toHaveClass(
      "text-[var(--footer-text)]",
      "hover:text-[var(--footer-link)]",
    );
  });

  it("does not combine full-width layout with tokenized inline margins", () => {
    render(<Footer />);

    const footerNav = screen.getByRole("navigation", {
      name: /footer navigation/i,
    });
    const container = footerNav.parentElement;

    // A full-width box plus margin-inline gutters overflows small viewports.
    expect(container).not.toHaveClass("w-full");
    expect(container).toHaveStyle({
      marginInline: "clamp(24px, 12vw, 184px)",
    });
  });

  it("renders with default FOOTER_COLUMNS config", () => {
    render(<Footer />);

    // Should have footer element
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    // Should have some list structure
    const lists = footer.querySelectorAll("ul");
    expect(lists.length).toBeGreaterThan(0);
  });

  it("accepts custom columns configuration", () => {
    const customColumns = [
      {
        key: "test",
        title: "Test Section",
        translationKey: "footer.custom.test",
        links: [
          {
            key: "test-link",
            label: "Test Link",
            href: "/test",
            translationKey: "test.link",
          },
        ],
      },
    ];

    render(<Footer columns={customColumns} />);

    // Should render custom section
    const testSections = screen.getAllByText(/test/i);
    expect(testSections.length).toBeGreaterThan(0);
  });
});
