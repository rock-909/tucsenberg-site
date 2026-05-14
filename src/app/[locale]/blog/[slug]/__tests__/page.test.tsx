import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BlogArticlePage, {
  generateMetadata,
  generateStaticParams,
} from "../page";

type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: string;
};

const mockGenerateMetadataForPath = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    if (key === "article.backToBlog") return "Back to blog";
    return key;
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: mockGenerateMetadataForPath,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("Blog Article Page", () => {
  it("returns localized static params for every starter article", () => {
    const params = generateStaticParams();

    expect(params).toHaveLength(8);
    expect(params).toContainEqual({
      locale: "en",
      slug: "prepare-before-launch",
    });
    expect(params).toContainEqual({
      locale: "zh",
      slug: "replace-the-starter",
    });
  });

  it("generates metadata for a valid article", async () => {
    mockGenerateMetadataForPath.mockReturnValueOnce({
      title: "Why Cloudflare is the recommended deployment path",
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "why-cloudflare" }),
    });

    expect(metadata).toEqual({
      title: "Why Cloudflare is the recommended deployment path",
    });
    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith({
      locale: "en",
      pageType: "blog",
      path: "/blog/why-cloudflare",
      config: {
        title: "Why Cloudflare is the recommended deployment path",
        description:
          "Cloudflare keeps the starter close to the deployment path it is designed to prove, while optional compatibility can stay secondary.",
        type: "article",
        publishedTime: "2026-05-05",
        modifiedTime: "2026-05-05",
        section: "Launch guide",
      },
    });
  });

  it("renders the article and back-to-blog path", async () => {
    render(
      await BlogArticlePage({
        params: Promise.resolve({
          locale: "en",
          slug: "prepare-before-launch",
        }),
      }),
    );

    expect(screen.getByRole("link", { name: "Back to blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "What to prepare before launching your first showcase website",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Start with confirmed facts")).toBeInTheDocument();
    expect(screen.getByText("Prepare real content assets")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
  });

  it("renders localized article content", async () => {
    render(
      await BlogArticlePage({
        params: Promise.resolve({
          locale: "zh",
          slug: "replace-the-starter",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "真实业务使用前必须替换哪些内容",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("先替换身份")).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      BlogArticlePage({
        params: Promise.resolve({
          locale: "en",
          slug: "missing",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
