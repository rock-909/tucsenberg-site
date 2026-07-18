import type { ProductMarketSlug } from "@/config/single-site-product-catalog";
import {
  capBuyerInterest,
  capConfigPrefill,
} from "@/components/forms/inquiry-payload";
import {
  getMarketBySlug,
  isProductMarketSlug,
} from "@/constants/product-catalog";

export type InquirySearchParams = Record<string, string | string[] | undefined>;

export type ValidatedInquiryContext =
  | {
      kind: "catalog-context";
      catalogProductId: ProductMarketSlug;
      displayLabel: string;
      buyerInterest?: string;
      initialMessage?: string;
    }
  | {
      kind: "general-context";
      buyerInterest?: string;
      initialMessage?: string;
    };

function readOptionalDescription(
  searchParams: InquirySearchParams,
  key: "interest" | "config",
): string | undefined {
  const value = searchParams[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return key === "interest"
    ? capBuyerInterest(raw ?? null)
    : capConfigPrefill(raw ?? null);
}

function readCatalogProductId(
  searchParams: InquirySearchParams,
): ProductMarketSlug | undefined {
  const value = searchParams.catalogProductId;
  if (Array.isArray(value) || typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return isProductMarketSlug(trimmed) ? trimmed : undefined;
}

export function resolveInquiryContext(
  searchParams: InquirySearchParams,
): ValidatedInquiryContext {
  const buyerInterest = readOptionalDescription(searchParams, "interest");
  const initialMessage = readOptionalDescription(searchParams, "config");
  const descriptionFields = {
    ...(buyerInterest ? { buyerInterest } : {}),
    ...(initialMessage ? { initialMessage } : {}),
  };

  const catalogProductId = readCatalogProductId(searchParams);
  if (!catalogProductId) {
    return {
      kind: "general-context",
      ...descriptionFields,
    };
  }

  const market = getMarketBySlug(catalogProductId);
  if (!market) {
    return {
      kind: "general-context",
      ...descriptionFields,
    };
  }

  return {
    kind: "catalog-context",
    catalogProductId,
    displayLabel: market.label,
    ...descriptionFields,
  };
}

export function createCatalogInquiryHref(
  catalogProductId: ProductMarketSlug,
  initialMessage?: string,
): `/request-quote${string}` {
  const params = new URLSearchParams({ catalogProductId });
  const cappedMessage = initialMessage
    ? capConfigPrefill(initialMessage)
    : undefined;

  if (cappedMessage) {
    params.set("config", cappedMessage);
  }

  return `/request-quote?${params.toString()}` as `/request-quote${string}`;
}
