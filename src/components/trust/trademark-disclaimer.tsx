import {
  TrademarkDisclaimerView,
  type TrademarkDisclaimerVariant,
} from "@/components/trust/trademark-disclaimer-view";
import { getOemBrandFacts } from "@/data/product-compatibility";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface TrademarkDisclaimerProps {
  locale: Locale;
  variant: TrademarkDisclaimerVariant;
  brandName?: string;
}

function readLegalMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["legal", "trademark", key], key);
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : value;
  });
}

export async function TrademarkDisclaimer({
  locale,
  variant,
  brandName,
}: TrademarkDisclaimerProps) {
  const messages = await loadCompleteMessages(locale);

  let text: string;
  if (variant === "footer") {
    const brands = getOemBrandFacts()
      .map((brand) => brand.displayName)
      .join(", ");
    text = interpolate(readLegalMessage(messages, "footer"), { brands });
  } else if (variant === "brand-notice") {
    text = interpolate(readLegalMessage(messages, "brandNotice"), {
      brand: brandName ?? "",
    });
  } else {
    text = readLegalMessage(messages, "inline");
  }

  return <TrademarkDisclaimerView variant={variant} text={text} />;
}
