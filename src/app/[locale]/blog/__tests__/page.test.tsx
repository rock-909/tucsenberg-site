import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BlogPage, { generateMetadata, generateStaticParams } from "../page";

type MockLinkHref = string | { pathname: string; params?: { slug?: string } };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const blogMessages: Record<string, string> = {
  "index.eyebrow": "Launch guide",
  "index.title": "Blog",
  "index.description":
    "Practical notes for turning a starter into a public showcase website: content, pages, deployment, analytics, and replacement boundaries.",
  "index.articleListLabel": "Starter launch articles",
  "index.readArticle": "Read article",
};

const mockGenerateMetadataForPath = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: MockLinkProps) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href.pathname.replace("[slug]", href.params?.slug ?? "");

    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => blogMessages[key] ?? key),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: mockGenerateMetadataForPath,
}));

describe("Blog Page", () => {
  it("returns static params for all locales", () => {
    expect(generateStaticParams()).toEqual([
      { locale: "en" },
      { locale: "zh" },
    ]);
  });

  it("generates metadata for the localized blog index", async () => {
    mockGenerateMetadataForPath.mockReturnValueOnce({
      title: "Blog",
      description:
        "Practical notes for turning a starter into a public showcase website: content, pages, deployment, analytics, and replacement boundaries.",
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata).toEqual({
      title: "Blog",
      description:
        "Practical notes for turning a starter into a public showcase website: content, pages, deployment, analytics, and replacement boundaries.",
    });
    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith({
      locale: "en",
      pageType: "blog",
      path: "/blog",
      config: {
        title: "Blog",
        description:
          "Practical notes for turning a starter into a public showcase website: content, pages, deployment, analytics, and replacement boundaries.",
        type: "website",
      },
    });
  });

  it("renders four starter launch article cards", async () => {
    render(
      await BlogPage({
        params: Promise.resolve({ locale: "en" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Blog" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Starter launch articles"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Read article/ })).toHaveLength(
      4,
    );
    expect(
      screen.getByRole("link", {
        name: /What to prepare before launching your first showcase website/,
      }),
    ).toHaveAttribute("href", "/blog/prepare-before-launch");
    expect(
      screen.getByRole("link", {
        name: /Why Cloudflare is the recommended deployment path/,
      }),
    ).toHaveAttribute("href", "/blog/why-cloudflare");
  });

  it("is an async server component", () => {
    const result = BlogPage({ params: Promise.resolve({ locale: "en" }) });

    expect(result).toBeInstanceOf(Promise);
  });
});
