import React from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAsyncPage } from "@/test/render-async-page";

const { mockGetPageBySlug, mockGetTranslations } = vi.hoisted(() => ({
  mockGetPageBySlug: vi.fn(),
  mockGetTranslations: vi.fn(),
}));

const pageContent = {
  metadata: {
    title: "Custom Project Support",
    description: "Custom project support description.",
    slug: "custom-project-support",
    publishedAt: "2024-01-01",
    faq: [],
  },
  content: "",
  slug: "custom-project-support",
  filePath: "content/pages/en/custom-project-support.mdx",
};

const zhPageContent = {
  ...pageContent,
  metadata: {
    ...pageContent.metadata,
    title: "定制项目支持",
  },
  filePath: "content/pages/zh/custom-project-support.mdx",
};

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof React>("react");

  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
  setRequestLocale: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  routing: { locales: ["en", "zh"], defaultLocale: "en" },
}));

vi.mock("@/app/[locale]/generate-static-params", () => ({
  generateLocaleStaticParams: () => [{ locale: "en" }, { locale: "zh" }],
}));

vi.mock("@/components/sections/faq-section", () => ({
  FaqSection: () => <section data-testid="faq-section">FAQ</section>,
}));

vi.mock("@/lib/content-query/queries", () => ({
  getPageBySlug: mockGetPageBySlug,
}));

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}

async function flushPendingMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Feature: Custom Project Support Page", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetTranslations.mockReset();
    mockGetTranslations.mockResolvedValue((key: string) => key);
    mockGetPageBySlug.mockReset();
    mockGetPageBySlug.mockImplementation(
      async (_slug: string, locale: string) =>
        locale === "zh" ? zhPageContent : pageContent,
    );
  });

  async function renderPage(locale = "en") {
    const { default: Page } = await import("../page");
    const page = await Page({
      params: Promise.resolve({ locale }),
    });
    return renderAsyncPage(page as React.JSX.Element);
  }

  it("renders the hero section with title", async () => {
    await renderPage();
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Custom Project Support");
  });

  it("renders 4 service scope modules", async () => {
    await renderPage();
    expect(
      await screen.findByText("scope.customSizes.title"),
    ).toBeInTheDocument();
    expect(screen.getByText("scope.privateLabel.title")).toBeInTheDocument();
    expect(
      screen.getByText("scope.implementationSupport.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("scope.qualityAssurance.title"),
    ).toBeInTheDocument();
  });

  it("renders 5 process steps", async () => {
    await renderPage();
    expect(await screen.findByText("process.step1.title")).toBeInTheDocument();
    expect(screen.getByText("process.step2.title")).toBeInTheDocument();
    expect(screen.getByText("process.step3.title")).toBeInTheDocument();
    expect(screen.getByText("process.step4.title")).toBeInTheDocument();
    expect(screen.getByText("process.step5.title")).toBeInTheDocument();
  });

  it("renders supported standards section", async () => {
    await renderPage();
    expect(await screen.findByText("standards.title")).toBeInTheDocument();
  });

  it("renders FAQ section", async () => {
    await renderPage();
    expect(await screen.findByTestId("faq-section")).toBeInTheDocument();
  });

  it("CTA links to the Step 2 coming-soon placeholder", async () => {
    await renderPage();
    const ctaLink = await screen.findByRole("link", { name: /cta\.button/i });
    expect(ctaLink).toHaveAttribute("href", "#coming-soon");
  });

  it("renders in Chinese locale", async () => {
    await renderPage("zh");
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("定制项目支持");
  });

  it("is an async server component", async () => {
    const mod = await import("../page");
    const result = mod.default({
      params: Promise.resolve({ locale: "en" }),
    });
    expect(result).toBeInstanceOf(Promise);
  });

  it("starts translations and content loading before either result resolves", async () => {
    const translations = createDeferred<(key: string) => string>();
    const page = createDeferred<typeof pageContent>();
    mockGetTranslations.mockReturnValueOnce(translations.promise);
    mockGetPageBySlug.mockReturnValueOnce(page.promise);

    const mod = await import("../page");
    const element = await mod.default({
      params: Promise.resolve({ locale: "en" }),
    });
    const rendered = renderAsyncPage(element as React.JSX.Element);

    await flushPendingMicrotasks();

    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "en",
      namespace: "customProject",
    });
    expect(mockGetPageBySlug).toHaveBeenCalledWith(
      "custom-project-support",
      "en",
    );

    translations.resolve((key: string) => key);
    page.resolve(pageContent);
    await rendered;
  });
});
