/**
 * Footer Component Tests
 *
 * Covers the hairline three-column footer with legal identity bar
 * (spec: docs/design/可迁移设计资产-剖面动画与页脚.md, asset 2).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/footer/Footer";
import { FOOTER_COLUMNS } from "@/config/footer-links";
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

describe("Footer Component", () => {
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

  it("accepts custom columns and marks external links", () => {
    render(
      <Footer
        columns={[
          {
            key: "custom",
            title: "Custom Section",
            translationKey: "footer.custom.title",
            links: [
              {
                key: "internal",
                label: "Internal Link",
                href: "/products",
                translationKey: "footer.custom.internal",
              },
              {
                key: "external",
                label: "External Link",
                href: "https://example.com",
                external: true,
                translationKey: "footer.custom.external",
              },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Custom Section" }),
    ).toBeInTheDocument();
    const internal = screen.getByRole("link", { name: "Internal Link" });
    expect(internal).not.toHaveAttribute("target");
    const external = screen.getByRole("link", { name: "External Link" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noreferrer noopener");

    expect(FOOTER_COLUMNS.map((column) => column.key)).toEqual([
      "navigation",
      "support",
    ]);
  });
});
