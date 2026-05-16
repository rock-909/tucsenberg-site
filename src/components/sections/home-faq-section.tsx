import { FaqSection } from "@/components/sections/faq-section";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { FaqItem, Locale } from "@/types/content.types";

export interface HomeFaqSectionProps {
  locale: Locale;
}

const FAQ_KEYS = ["q01", "q02", "q03", "q04", "q05", "q06"] as const;

function readFaq(messages: MessageRecord, path: string[]): string {
  const fullPath = ["home", "faq", ...path];
  return readMessagePath(messages, fullPath, fullPath.join("."));
}

export async function HomeFaqSection({ locale }: HomeFaqSectionProps) {
  const messages = await loadCompleteMessages(locale);

  const faqItems: FaqItem[] = FAQ_KEYS.map((key) => ({
    id: key,
    question: readFaq(messages, ["items", key, "question"]),
    answer: readFaq(messages, ["items", key, "answer"]),
  }));

  return (
    <FaqSection
      locale={locale}
      title={readFaq(messages, ["sectionTitle"])}
      faqItems={faqItems}
    />
  );
}
