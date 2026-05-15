import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getContentEntryMock = vi.hoisted(() => vi.fn());
const pageImporterMock = vi.hoisted(() => vi.fn());
const failingImporterMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/content-manifest", () => ({
  getContentEntry: getContentEntryMock,
}));

vi.mock("@/lib/mdx-importers.generated", () => ({
  pageImporters: {
    en: {
      exists: pageImporterMock,
      fails: failingImporterMock,
    },
  },
  postImporters: {
    en: {},
  },
  productImporters: {
    en: {},
  },
}));

describe("mdx-loader manifest-only runtime behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    getContentEntryMock.mockReset();
    pageImporterMock.mockReset();
    failingImporterMock.mockReset();
  });

  it("returns null when the manifest entry is missing", async () => {
    getContentEntryMock.mockReturnValue(undefined);
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "missing")).resolves.toBeNull();
    expect(pageImporterMock).not.toHaveBeenCalled();
  });

  it("returns null when the manifest entry exists but no importer exists", async () => {
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "missing-importer",
      extension: ".mdx",
      filePath: "/content/pages/en/missing-importer.mdx",
      relativePath: "content/pages/en/missing-importer.mdx",
      metadata: {},
      content: "",
    });
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(
      getMDXComponent("pages", "en", "missing-importer"),
    ).resolves.toBeNull();
  });

  it("returns the generated importer component when manifest and importer exist", async () => {
    const Component: ComponentType = () => null;
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "exists",
      extension: ".mdx",
      filePath: "/content/pages/en/exists.mdx",
      relativePath: "content/pages/en/exists.mdx",
      metadata: {},
      content: "",
    });
    pageImporterMock.mockResolvedValue({ default: Component });
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "exists")).resolves.toBe(
      Component,
    );
  });

  it("falls Spanish page MDX back to the English importer during Step 2", async () => {
    const Component: ComponentType = () => null;
    getContentEntryMock.mockImplementation(
      (type: string, locale: string, slug: string) => {
        if (type !== "pages" || slug !== "exists" || locale !== "en") {
          return undefined;
        }

        return {
          type: "pages",
          locale: "en",
          slug: "exists",
          extension: ".mdx",
          filePath: "/content/pages/en/exists.mdx",
          relativePath: "content/pages/en/exists.mdx",
          metadata: {},
          content: "",
        };
      },
    );
    pageImporterMock.mockResolvedValue({ default: Component });
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "es", "exists")).resolves.toBe(
      Component,
    );
    expect(getContentEntryMock).toHaveBeenNthCalledWith(
      1,
      "pages",
      "es",
      "exists",
    );
    expect(getContentEntryMock).toHaveBeenNthCalledWith(
      2,
      "pages",
      "en",
      "exists",
    );
  });

  it("returns null when the generated importer rejects", async () => {
    getContentEntryMock.mockReturnValue({
      type: "pages",
      locale: "en",
      slug: "fails",
      extension: ".mdx",
      filePath: "/content/pages/en/fails.mdx",
      relativePath: "content/pages/en/fails.mdx",
      metadata: {},
      content: "",
    });
    failingImporterMock.mockRejectedValue(new Error("load failed"));
    const { getMDXComponent } = await import("@/lib/mdx-loader");

    await expect(getMDXComponent("pages", "en", "fails")).resolves.toBeNull();
  });
});
