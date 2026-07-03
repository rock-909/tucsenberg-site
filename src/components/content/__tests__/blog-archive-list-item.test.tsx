import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogArchiveListItem } from "@/components/content/blog-archive-list-item";
import type { StarterBlogArticle } from "@/lib/blog/starter-blog";

const sampleArticle: StarterBlogArticle = {
  slug: "verify-before-go-live",
  title: "How to verify forms, analytics, and contact routing before launch",
  description:
    "Check the inquiry path, analytics events, and contact routing on a preview URL before you announce the site.",
  category: "Launch verification",
  tags: ["launch", "forms"],
  publishedAt: "2026-05-03",
  readingTime: "3 min read",
  sections: [
    {
      heading: "Run the preview canary",
      body: "Submit a test inquiry on the deployed preview URL.",
    },
  ],
};

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    prefetch,
    ...props
  }: {
    href: string;
    children: ReactNode;
    prefetch?: boolean;
  }) => (
    <a
      href={href}
      {...props}
      data-prefetch={prefetch === undefined ? "default" : String(prefetch)}
    >
      {children}
    </a>
  ),
}));

describe("BlogArchiveListItem", () => {
  it("renders catalog rows with formatted dates and a leader line", () => {
    const { container } = render(
      <BlogArchiveListItem
        article={sampleArticle}
        locale="en"
        variant="catalog"
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: sampleArticle.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("May 3, 2026")).toBeInTheDocument();
    expect(screen.queryByText(sampleArticle.description)).not.toBeInTheDocument();
    expect(container.querySelector(".h-px.flex-1.bg-border")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /How to verify forms, analytics, and contact routing before launch/,
      }),
    ).toHaveAttribute("href", "/blog/verify-before-go-live");
    expect(
      screen.getByRole("link", {
        name: /How to verify forms, analytics, and contact routing before launch/,
      }),
    ).toHaveAttribute("data-prefetch", "false");

    const publishedTime = screen.getByText("May 3, 2026").closest("time");
    expect(publishedTime).not.toBeNull();
    expect(publishedTime?.closest("[aria-hidden='true']")).toBeNull();
  });

  it("keeps the default variant for related-article lists", () => {
    render(
      <BlogArchiveListItem
        article={sampleArticle}
        showDescription
        variant="default"
      />,
    );

    expect(screen.getByText(sampleArticle.description)).toBeInTheDocument();
    expect(screen.getByText("May 3, 2026")).toBeInTheDocument();
    expect(screen.getByText(sampleArticle.category)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /How to verify forms, analytics, and contact routing before launch/,
      }),
    ).toHaveAttribute("data-prefetch", "false");
  });
});
