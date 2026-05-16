"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  findCompatibilityMatches,
  type ModelCompatibilityEntry,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility";
import { Link } from "@/i18n/routing";
import { localizeText } from "@/lib/i18n/localize-text";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;

const EMPTY_RESULTS: {
  models: ModelCompatibilityEntry[];
  products: ProductCompatibilityEntry[];
} = { models: [], products: [] };

type Translate = (key: string, values?: Record<string, string>) => string;

interface CompatibilitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ModelResults({
  models,
  t,
  onClose,
}: {
  models: ModelCompatibilityEntry[];
  t: Translate;
  onClose: () => void;
}) {
  return (
    <section className="px-2 py-3">
      <h2 className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("modelsHeading")}
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
                onClick={onClose}
                className="block"
              >
                <span className="text-sm font-medium text-foreground">
                  {model.modelName}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {model.brandName}
                </span>
                {model.oemPartNumbers.length > 0 ? (
                  <span className="mt-0.5 block font-mono text-xs tabular-nums text-muted-foreground">
                    {model.oemPartNumbers.join(" · ")}
                  </span>
                ) : null}
              </Link>
              <Link
                href={
                  `/quote?partNumber=${encodeURIComponent(
                    firstPart,
                  )}&brand=${encodeURIComponent(
                    model.brandName,
                  )}&model=${encodeURIComponent(model.modelSlug)}` as "/"
                }
                prefetch={false}
                onClick={onClose}
                className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
              >
                {t("requestQuote")}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProductResults({
  products,
  locale,
  t,
  onClose,
}: {
  products: ProductCompatibilityEntry[];
  locale: string;
  t: Translate;
  onClose: () => void;
}) {
  return (
    <section className="border-t border-border px-2 py-3">
      <h2 className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("productsHeading")}
      </h2>
      <ul>
        {products.map((product) => (
          <li
            key={product.productVariantId}
            className="rounded-[6px] p-2 hover:bg-accent/60"
          >
            <Link
              href={`/membranes/${product.canonicalProductSlug}` as "/"}
              prefetch={false}
              onClick={onClose}
              className="block"
            >
              <span className="text-sm font-medium text-foreground">
                {localizeText(product.name, locale)}
              </span>
              <span className="ml-2 font-mono text-xs tabular-nums text-muted-foreground">
                {product.sku}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CompatibilitySearchModal({
  isOpen,
  onClose,
}: CompatibilitySearchModalProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Intentional: React's documented "reset state on prop change during render" pattern.
  // react:doctor no-derived-useState is knowingly accepted here — useRef would not re-render to clear the query.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setQuery("");
  }

  // Autofocus via callback ref so the input is focused when it mounts,
  // without an effect that lint flags as an event-handler proxy.
  const focusOnMount = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= MIN_QUERY_LENGTH;

  const results = useMemo(() => {
    if (!hasQuery) return EMPTY_RESULTS;
    return findCompatibilityMatches(trimmed);
  }, [hasQuery, trimmed]);

  if (!isOpen) {
    return null;
  }

  const showNoResults =
    hasQuery && results.models.length === 0 && results.products.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("label")}
        className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <input
            ref={focusOnMount}
            type="search"
            role="searchbox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder={t("placeholder")}
            aria-label={t("label")}
            className={cn(
              "h-10 w-full min-w-0 rounded-[6px] border border-input bg-transparent px-3 text-base outline-none",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
            )}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="shrink-0 rounded-[6px] px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t("close")}
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {showNoResults ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {t("noResults", { query: trimmed })}
            </p>
          ) : null}

          {results.models.length > 0 ? (
            <ModelResults models={results.models} t={t} onClose={onClose} />
          ) : null}

          {results.products.length > 0 ? (
            <ProductResults
              products={results.products}
              locale={locale}
              t={t}
              onClose={onClose}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
