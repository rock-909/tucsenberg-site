import "server-only";

import {
  LAYER1_FACTS,
  extractFaqFromMetadata,
  generateFaqSchemaFromItems,
  interpolateFaqAnswer,
} from "@/lib/content/mdx-faq";
import { getContactCopyFromMessages } from "@/lib/contact/getContactCopy";
import { getContentLocaleCandidates } from "@/lib/content-locale-fallback";
import { CONTENT_MANIFEST } from "@/lib/content-manifest.generated";
import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";
import { getStaticSplitMessages } from "@/lib/i18n/static-split-messages";
import type { FaqItem, Locale, Page } from "@/types/content.types";

export interface ContactPageData {
  page: Page;
  messages: Record<string, unknown>;
  copy: ReturnType<typeof getContactCopyFromMessages>;
  faqItems: FaqItem[];
  faqSectionTitle: string;
  faqSchema: ReturnType<typeof generateFaqSchemaFromItems> | null;
}

function getStaticMessages(locale: Locale): Record<string, unknown> {
  return getStaticSplitMessages(locale);
}

export function getStaticContactPage(locale: Locale): Page {
  const entry = getContentLocaleCandidates("pages", locale)
    .map((candidateLocale) => {
      return CONTENT_MANIFEST.byKey[`pages/${candidateLocale}/contact`];
    })
    .find((candidateEntry) => candidateEntry !== undefined);

  if (entry === undefined) {
    throw new Error(`Static contact page not found for locale: ${locale}`);
  }

  return {
    slug: entry.slug,
    filePath: entry.filePath,
    metadata: entry.metadata,
    content: entry.content,
  } as unknown as Page;
}

export function getContactPageData(locale: Locale): ContactPageData {
  const page = getStaticContactPage(locale);
  const messages = getStaticMessages(locale);
  const copy = getContactCopyFromMessages(messages);
  const faqItems: FaqItem[] = extractFaqFromMetadata(page.metadata).map(
    (item) => ({
      ...item,
      answer: interpolateFaqAnswer(item.answer, LAYER1_FACTS),
    }),
  );
  const faqSectionTitle = readRequiredMessagePath(messages, [
    "faq",
    "sectionTitle",
  ]);
  const faqSchema =
    faqItems.length > 0 ? generateFaqSchemaFromItems(faqItems, locale) : null;

  return {
    page,
    messages,
    copy,
    faqItems,
    faqSectionTitle,
    faqSchema,
  };
}
