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

/**
 * Single source of the home FAQ items. Both the rendered section and the
 * page-level JSON-LD graph consume this so the FAQ copy/key list is not
 * duplicated.
 */
export async function getHomeFaqItems(locale: Locale): Promise<FaqItem[]> {
  const messages = await loadCompleteMessages(locale);

  return FAQ_KEYS.map((key) => ({
    id: key,
    question: readFaq(messages, ["items", key, "question"]),
    answer: readFaq(messages, ["items", key, "answer"]),
  }));
}

export async function HomeFaqSection({
  locale,
  renderJsonLd = true,
}: HomeFaqSectionProps) {
  const messages = await loadCompleteMessages(locale);
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
