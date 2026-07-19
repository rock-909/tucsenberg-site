/**
 * Footer Component Tests
 *
 * Covers the hairline three-column footer with legal identity bar
 * (spec: docs/design/可迁移设计资产-剖面动画与页脚.md, asset 2).
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/footer/Footer";
import { FOOTER_COLUMNS } from "@/config/footer-links";
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { getSiteMessageValues } from "@/lib/i18n/site-message-values";

function readStrictMessage(
  messages: Record<string, unknown>,
  path: string,
): string {
  const value = path.split(".").reduce<unknown>((current, segment) => {
    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current)
    ) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, messages);

  if (typeof value !== "string") {
    throw new Error(`Missing test message: ${path}`);
  }

  return value.replace(/\{copyright\}/gu, getSiteMessageValues().copyright.en);
}

const composedMessages = getComposedMessages("en");

const { mockUseTranslations } = vi.hoisted(() => ({
  mockUseTranslations: vi.fn(
    () => (key: string) => readStrictMessage(composedMessages, key),
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: mockUseTranslations,
}));

describe("Footer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("keeps footer navigation aligned with the Tucsenberg catalog IA", () => {
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

    expect(navigationLinks).toEqual([
      { href: "/", text: "Home" },
      { href: "/products", text: "Products" },
      { href: "/oem-wholesale", text: "OEM & Wholesale" },
      {
        href: "/guides/flood-barrier-materials-guide",
        text: "Materials Guide",
      },
      {
        href: "/guides/flood-barrier-specifications",
        text: "Specifications Guide",
      },
      { href: "/about", text: "About" },
    ]);
    expect(navigationLinks).not.toContainEqual({
      href: "/contact",
      text: "Contact",
    });
    expect(supportLinks).toContainEqual({
      href: "/request-quote",
      text: "Request a Quote",
    });
  });

  it("requires footer section title messages instead of config English fallbacks", () => {
    expect(
      readStrictMessage(composedMessages, "footer.sections.navigation.title"),
    ).toBe("Navigation");

    const incompleteMessages = structuredClone(composedMessages);
    const sections = (
      incompleteMessages.footer as Record<
        string,
        Record<string, Record<string, unknown>>
      >
    ).sections;
    delete sections.navigation.title;

    expect(() =>
      readStrictMessage(incompleteMessages, "footer.sections.navigation.title"),
    ).toThrow("Missing test message: footer.sections.navigation.title");
  });

  it("renders the brand wordmark with an accessible site name", () => {
    render(<Footer />);

    expect(screen.getByText(SINGLE_SITE_CONFIG.name)).toHaveClass("sr-only");
    expect(screen.getByText("=")).toHaveClass("text-primary");
  });

  it("renders the legal identity bar from single-site config", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        `${SINGLE_SITE_FACTS.company.name} · ${SINGLE_SITE_CONFIG.contact.email}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) =>
          content.startsWith("© ") && content.includes("All rights reserved"),
      ),
    ).toBeInTheDocument();
  });

  it("uses footer-specific color tokens for the flat footer surface", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass(
      "bg-[var(--footer-bg)]",
      "border-[var(--footer-divider)]",
    );

    const firstHeading = screen.getAllByRole("heading", { level: 2 })[0];
    expect(firstHeading).toHaveClass("text-[var(--footer-heading)]");

    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink).toHaveClass(
      "text-[var(--footer-text)]",
      "hover:text-[var(--primary-text)]",
    );
  });

  it("keeps links block-level with padded touch targets", () => {
    render(<Footer />);

    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink).toHaveClass("block", "py-1.5");
  });

  it("renders theme toggle slot in the legal bar when provided", () => {
    render(<Footer themeToggleSlot={<button>Toggle Theme</button>} />);
    expect(screen.getByText("Toggle Theme")).toBeInTheDocument();
  });

  it("applies custom className and data-theme", () => {
    const { container } = render(
      <Footer className="custom-footer" dataTheme="dark" />,
    );
    const footer = container.querySelector(".custom-footer");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute("data-theme", "dark");
  });

  it("uses the formal footer column configuration", () => {
    render(<Footer />);

    expect(FOOTER_COLUMNS.map((column) => column.key)).toEqual([
      "navigation",
      "support",
    ]);
  });
});
