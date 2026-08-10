import { getPageBySlug } from "@/lib/content-query/queries";
import { slugifyHeading } from "@/lib/content/render-static-markdown-content";
import type { LegalPageMetadata, Locale } from "@/types/content.types";

export interface HeadingItem {
  level: 2;
  text: string;
  id: string;
}

const H2_PREFIX = "## ";

export function extractHeadingsFromContent(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(H2_PREFIX)) {
      const text = trimmed.slice(H2_PREFIX.length).trim();
      headings.push({ level: 2, text, id: slugifyHeading(text) });
    }
  }

  return headings;
}

interface LegalPageData {
  metadata: LegalPageMetadata;
  content: string;
  headings: HeadingItem[];
}

export async function loadLegalPage(
  slug: string,
  locale: Locale,
): Promise<LegalPageData> {
  const page = await getPageBySlug(slug, locale);

  const metadata: LegalPageMetadata = {
    ...page.metadata,
    layout: "legal",
    showToc: true,
    lastReviewed:
      page.metadata.lastReviewed ??
      page.metadata.updatedAt ??
      page.metadata.publishedAt,
  };

  const headings = extractHeadingsFromContent(page.content);

  return { metadata, content: page.content, headings };
}
