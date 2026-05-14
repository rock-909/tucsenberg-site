import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-page-expression";
import {
  isValidMarketFamilyCombo,
  isValidMarketSlug,
} from "@/constants/product-catalog";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import { readMessagePath } from "@/lib/i18n/read-message-path";

export const PRODUCT_FAMILY_CONTACT_INTENT = "product-family" as const;

type SearchParamValue = string | string[] | undefined;

export interface ProductFamilyContactContext {
  intent: typeof PRODUCT_FAMILY_CONTACT_INTENT;
  marketSlug: string;
  familySlug: string;
  marketLabel: string;
  familyLabel: string;
}

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function buildProductFamilyContactHref({
  marketSlug,
  familySlug,
}: {
  marketSlug: string;
  familySlug: string;
}): LinkHref {
  return {
    pathname: SINGLE_SITE_HOME_LINK_TARGETS.contact,
    query: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      market: marketSlug,
      family: familySlug,
    },
  };
}

export function parseProductFamilyContactContext({
  searchParams,
  messages,
}: {
  searchParams: Record<string, SearchParamValue>;
  messages: Record<string, unknown>;
}): ProductFamilyContactContext | null {
  const intent = firstParam(searchParams.intent);
  const marketSlug = firstParam(searchParams.market);
  const familySlug = firstParam(searchParams.family);

  if (
    intent !== PRODUCT_FAMILY_CONTACT_INTENT ||
    !marketSlug ||
    !familySlug ||
    !isValidMarketSlug(marketSlug) ||
    !isValidMarketFamilyCombo(marketSlug, familySlug)
  ) {
    return null;
  }

  return {
    intent,
    marketSlug,
    familySlug,
    marketLabel: readMessagePath(
      messages,
      ["catalog", "markets", marketSlug, "label"],
      marketSlug,
    ),
    familyLabel: readMessagePath(
      messages,
      ["catalog", "families", marketSlug, familySlug, "label"],
      familySlug,
    ),
  };
}
