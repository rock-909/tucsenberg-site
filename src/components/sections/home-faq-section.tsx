import { cache } from "react";
import { FaqSection } from "@/components/sections/faq-section";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { FaqItem, Locale } from "@/types/content.types";

export interface HomeFaqSectionProps {
  locale: Locale;
  renderJsonLd?: boolean;
}

const FAQ_KEYS = ["q01", "q02", "q03", "q04", "q05", "q06"] as const;

function readFaq(messages: MessageRecord, path: string[]): string {
  const fullPath = ["home", "faq", ...path];
  return readMessagePath(messages, fullPath, fullPath.join("."));
}

// Request-level dedupe: home FAQ is consumed twice per page render — once
// for the page-level JSON-LD graph (src/app/[locale]/page.tsx) and once by
// HomeFaqSection itself. Without React.cache each consumer ran its own
// loadCompleteMessages + catalog walk; with it, one walk per locale per
// render. Conventions.md authorizes React.cache for request-level dedupe.
const loadHomeFaqMessages = cache(
  (locale: Locale): Promise<MessageRecord> => loadCompleteMessages(locale),
);

/**
 * Single source of the home FAQ items. Both the rendered section and the
 * page-level JSON-LD graph consume this so the FAQ copy/key list is not
 * duplicated. Wrapped in React.cache so a single render pass derives the
 * items once even when called from multiple consumers.
 */
export const getHomeFaqItems = cache(
  async (locale: Locale): Promise<FaqItem[]> => {
    const messages = await loadHomeFaqMessages(locale);

    return FAQ_KEYS.map((key) => ({
      id: key,
      question: readFaq(messages, ["items", key, "question"]),
      answer: readFaq(messages, ["items", key, "answer"]),
    }));
  },
);

export async function HomeFaqSection({
  locale,
  renderJsonLd = true,
}: HomeFaqSectionProps) {
  const messages = await loadHomeFaqMessages(locale);
  const faqItems = await getHomeFaqItems(locale);

  return (
    <FaqSection
      locale={locale}
      title={readFaq(messages, ["sectionTitle"])}
      faqItems={faqItems}
      renderJsonLd={renderJsonLd}
    />
  );
}
