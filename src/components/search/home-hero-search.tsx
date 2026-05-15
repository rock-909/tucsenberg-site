"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  findCompatibilityMatches,
  type LocalizedText,
  type ModelCompatibilityEntry,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;

const EMPTY_RESULTS: {
  models: ModelCompatibilityEntry[];
  products: ProductCompatibilityEntry[];
} = { models: [], products: [] };

type Translate = (key: string, values?: Record<string, string>) => string;

function localized(text: LocalizedText, locale: string): string {
  if (locale === "es") return text.es;
  if (locale === "zh") return text.zh;
  return text.en;
}

function ModelRows({
  models,
  tSearch,
}: {
  models: ModelCompatibilityEntry[];
  tSearch: Translate;
}) {
  return (
    <section className="px-2 py-3">
      <h2 className="px-2 pb-1 font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
        {tSearch("modelsHeading")}
      </h2>
      <ul>
        {models.map((model) => {
          const firstPart = model.oemPartNumbers[0] ?? model.modelSlug;
          return (
            <li
              key={model.modelId}
              className="rounded-[6px] p-2 hover:bg-accent/60"
            >
              <Link
                href={`/compatible/${model.brandSlug}` as "/"}
                prefetch={false}
                className="block"
              >
                <span className="text-sm font-medium text-foreground">
                  {model.modelName}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {model.brandName}
                </span>
                {model.oemPartNumbers.length > 0 ? (
                  <span className="mt-0.5 block font-mono text-[14px] tabular-nums text-muted-foreground">
                    {model.oemPartNumbers.join(" · ")}
                  </span>
                ) : null}
              </Link>
              <Link
                href={
                  `/quote?partNumber=${encodeURIComponent(
                    firstPart,
                  )}&model=${encodeURIComponent(model.modelSlug)}` as "/"
                }
                prefetch={false}
                className="mt-1 inline-block text-xs font-medium text-[var(--brand-teal)] hover:underline"
              >
                {tSearch("requestQuote")}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProductRows({
  products,
  locale,
  tSearch,
}: {
  products: ProductCompatibilityEntry[];
  locale: string;
  tSearch: Translate;
}) {
  return (
    <section className="border-t border-border px-2 py-3">
      <h2 className="px-2 pb-1 font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
        {tSearch("productsHeading")}
      </h2>
      <ul>
        {products.map((product) => (
          <li
            key={product.productVariantId}
            className="rounded-[6px] p-2 hover:bg-accent/60"
          >
            <Link
              href={`/membranes/${product.productSlug}` as "/"}
              prefetch={false}
              className="block"
            >
              <span className="text-sm font-medium text-foreground">
                {localized(product.name, locale)}
              </span>
              <span className="ml-2 font-mono text-[14px] tabular-nums text-muted-foreground">
                {product.sku}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeHeroSearch() {
  const tHero = useTranslations("home.hero");
  const tSearch = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const listboxId = useId();

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;

  const results = useMemo(() => {
    if (!hasQuery) return EMPTY_RESULTS;
    return findCompatibilityMatches(trimmed);
  }, [hasQuery, trimmed]);

  const hasMatches = results.models.length > 0 || results.products.length > 0;
  const showPanel = hasQuery;
  const showNoResults = hasQuery && !hasMatches;

  return (
    <div className="relative w-full max-w-[640px]">
      <input
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-label={tHero("searchLabel")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tHero("searchPlaceholder")}
        className={cn(
          "h-12 w-full min-w-0 rounded-[6px] border border-input bg-card px-4 text-base text-foreground outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
        )}
      />

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={tHero("searchLabel")}
          className="absolute top-[calc(100%+8px)] left-0 z-20 max-h-[60vh] w-full overflow-y-auto rounded-[8px] border border-border bg-card shadow-border"
        >
          {showNoResults ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {tSearch("noResults", { query: trimmed })}
            </p>
          ) : null}

          {results.models.length > 0 ? (
            <ModelRows models={results.models} tSearch={tSearch} />
          ) : null}

          {results.products.length > 0 ? (
            <ProductRows
              products={results.products}
              locale={locale}
              tSearch={tSearch}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
