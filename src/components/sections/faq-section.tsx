import { JsonLdScript } from "@/components/seo";
import { FaqSectionView } from "@/components/sections/faq-section-view";
import { siteFacts } from "@/config/site-facts";
import { generateFaqSchemaFromItems } from "@/lib/content/mdx-faq";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import type { FaqItem, Locale } from "@/types/content.types";

const FAQ_ICU_VALUES = {
  established: siteFacts.company.established,
  countries: siteFacts.stats.exportCountries,
  employees: siteFacts.company.employees,
};

interface FaqSectionKeyProps {
  items: string[];
  faqItems?: never;
  title?: string;
  subtitle?: string;
  locale: Locale;
  renderJsonLd?: boolean;
}

interface FaqSectionDirectProps {
  items?: never;
  faqItems: FaqItem[];
  title?: string;
  subtitle?: string;
  locale: Locale;
  renderJsonLd?: boolean;
}

type FaqSectionProps = FaqSectionKeyProps | FaqSectionDirectProps;

function readFaqMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["faq", ...key.split(".")], key);
}

function interpolateMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export async function FaqSection(props: FaqSectionProps) {
  const { title, subtitle, locale, renderJsonLd = true } = props;

  let faqData: Array<{ key: string; question: string; answer: string }>;
  let schemaData: unknown;
  let sectionTitle = title;

  if ("faqItems" in props && props.faqItems) {
    faqData = props.faqItems.map((item) => ({
      key: item.id,
      question: item.question,
      answer: item.answer,
    }));
    schemaData = generateFaqSchemaFromItems(props.faqItems, locale);

    if (sectionTitle === undefined) {
      const messages = await loadCompleteMessages(locale);
      sectionTitle = interpolateMessage(
        readFaqMessage(messages, "sectionTitle"),
        FAQ_ICU_VALUES,
      );
    }
  } else {
    const messages = await loadCompleteMessages(locale);
    const pick = (key: string) =>
      interpolateMessage(readFaqMessage(messages, key), FAQ_ICU_VALUES);
    const keys = props.items ?? [];
    faqData = keys.map((key) => ({
      key,
      question: pick(`items.${key}.question`),
      answer: pick(`items.${key}.answer`),
    }));
    schemaData = generateFaqSchemaFromItems(
      faqData.map(({ key, question, answer }) => ({
        id: key,
        question,
        answer,
      })),
      locale,
    );
    sectionTitle ??= pick("sectionTitle");
  }

  return (
    <>
      {renderJsonLd ? <JsonLdScript data={schemaData} /> : null}
      <FaqSectionView
        title={sectionTitle}
        {...(subtitle ? { subtitle } : {})}
        items={faqData}
      />
    </>
  );
}
