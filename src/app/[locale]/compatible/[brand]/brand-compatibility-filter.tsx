"use client";

import { useMemo, useState } from "react";
import {
  StatusBadge,
  type StatusTone,
} from "@/components/compatibility/status-badge";
import { Link } from "@/i18n/routing";

export interface CompatibleProductVM {
  id: string;
  name: string;
  sku: string;
  material: "epdm" | "tpu";
  fitStatusLabel: string;
  fitStatusTone: StatusTone;
  confidenceLabel: string;
  confidenceTone: StatusTone;
  checks: string[];
  disclaimer: string;
  quoteHref: string;
}

export interface ModelVM {
  modelId: string;
  modelName: string;
  category: "disc" | "tube";
  oemPartNumbers: string[];
  products: CompatibleProductVM[];
}

export interface FilterLabels {
  all: string;
  disc: string;
  tube: string;
  materialLabel: string;
  materialAll: string;
  materialEpdm: string;
  materialTpu: string;
  partNumbers: string;
  crossRefNote: string;
  compatibleProduct: string;
  requiredChecks: string;
  noChecksRequired: string;
  requestQuote: string;
  empty: string;
}

type CategoryFilter = "all" | "disc" | "tube";
type MaterialFilter = "all" | "epdm" | "tpu";

function matchesFilters(
  model: ModelVM,
  category: CategoryFilter,
  material: MaterialFilter,
): boolean {
  if (category !== "all" && model.category !== category) return false;
  if (material === "all") return true;
  return model.products.some((product) => product.material === material);
}

function ProductBlock({
  product,
  labels,
}: {
  product: CompatibleProductVM;
  labels: FilterLabels;
}) {
  return (
    <div className="border-t border-border pt-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-foreground">
          {product.name}
        </span>
        <span className="font-mono text-[14px] tabular-nums text-muted-foreground">
          {product.sku}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <StatusBadge tone={product.fitStatusTone}>
          {product.fitStatusLabel}
        </StatusBadge>
        <StatusBadge tone={product.confidenceTone}>
          {product.confidenceLabel}
        </StatusBadge>
      </div>
      {product.checks.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium text-[var(--color-brand-accent)]">
            {labels.requiredChecks}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {product.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {product.disclaimer}
          </p>
        </details>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {labels.noChecksRequired}
        </p>
      )}
      <Link
        href={product.quoteHref as "/"}
        prefetch={false}
        className="mt-3 inline-block text-sm font-medium text-[var(--color-brand-accent)] hover:underline"
      >
        {labels.requestQuote}
      </Link>
    </div>
  );
}

export function BrandCompatibilityFilter({
  models,
  labels,
}: {
  models: ModelVM[];
  labels: FilterLabels;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [material, setMaterial] = useState<MaterialFilter>("all");

  const filtered = useMemo(
    () => models.filter((model) => matchesFilters(model, category, material)),
    [models, category, material],
  );

  const tabs: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: labels.all },
    { key: "disc", label: labels.disc },
    { key: "tube", label: labels.tube },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label={labels.all} className="flex gap-6">
          {tabs.map((tab) => {
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.key)}
                className={
                  active
                    ? "border-b-2 border-[var(--color-brand-accent)] pb-1 text-sm font-semibold text-primary"
                    : "border-b-2 border-transparent pb-1 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          {labels.materialLabel}
          <select
            value={material}
            onChange={(event) =>
              setMaterial(event.target.value as MaterialFilter)
            }
            className="h-9 rounded-[6px] border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <option value="all">{labels.materialAll}</option>
            <option value="epdm">{labels.materialEpdm}</option>
            <option value="tpu">{labels.materialTpu}</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul
          data-testid="model-results"
          className="mt-9 grid gap-4 md:grid-cols-2"
        >
          {filtered.map((model) => (
            <li
              key={model.modelId}
              className="rounded-[8px] border border-border bg-card p-6 shadow-border"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {model.modelName}
              </h2>
              <p className="mt-1 text-xs tracking-[0.4px] text-muted-foreground uppercase">
                {labels.partNumbers}
              </p>
              <p className="mt-1 font-mono text-[14px] tabular-nums text-foreground">
                {model.oemPartNumbers.join(" · ")}
              </p>
              <p className="mt-4 text-xs tracking-[0.4px] text-muted-foreground uppercase">
                {labels.compatibleProduct}
              </p>
              <div className="mt-3 space-y-4">
                {model.products.map((product) => (
                  <ProductBlock
                    key={product.id}
                    product={product}
                    labels={labels}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        {labels.crossRefNote}
      </p>
    </div>
  );
}
