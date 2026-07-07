import type { ComponentProps } from "react";

import { HeroGuideOverlay } from "@/components/grid/hero-guide-overlay";
import { ProductLineGlyph } from "@/components/products/product-diagrams";
import { Button } from "@/components/ui/button";
import type { TucsenbergProductDiagramKind } from "@/constants/tucsenberg-product-page-types";
import { Link } from "@/i18n/routing";

type HeroSectionHref = ComponentProps<typeof Link>["href"];

interface HeroSectionProofItem {
  value: string;
  label?: string;
}

interface HeroSectionCta {
  label: string;
  href: HeroSectionHref;
}

interface HeroSectionPreview {
  label: string;
  title: string;
  description: string;
  items: string[];
  /** Optional decorative line glyph per item, aligned by index. */
  itemGlyphs?: TucsenbergProductDiagramKind[];
}

export interface HeroSectionContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: HeroSectionCta;
  secondaryCta: HeroSectionCta;
  proofAriaLabel: string;
  proofItems: HeroSectionProofItem[];
  preview: HeroSectionPreview;
}

export interface HeroSectionViewProps {
  content: HeroSectionContent;
  previewTitleId?: string;
}

const DEFAULT_PREVIEW_TITLE_ID = "hero-preview-title";

function HeroEyebrow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary size-2 rounded-full" aria-hidden="true" />
      <span className="text-muted-foreground text-[13px] font-medium tracking-[0.04em] uppercase">
        {text}
      </span>
    </div>
  );
}

function HeroVisual({
  preview,
  previewTitleId,
}: {
  preview: HeroSectionPreview;
  previewTitleId: string;
}) {
  return (
    <div className="min-w-0">
      <div
        data-testid="hero-preview-card"
        aria-labelledby={previewTitleId}
        className="surface-card p-5 shadow-none md:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
            {preview.label}
          </span>
          <span
            className="bg-foreground/40 size-2.5 rounded-full"
            aria-hidden
          />
        </div>

        <div className="mt-5 min-w-0">
          <h2
            id={previewTitleId}
            className="text-foreground text-2xl font-semibold text-balance"
          >
            {preview.title}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6 text-pretty">
            {preview.description}
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-2 md:gap-3">
          {preview.items.map((item, index) => {
            const glyph = preview.itemGlyphs?.[index];
            return (
              <li
                key={item}
                className="border-border bg-background text-foreground flex min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium break-words"
              >
                {glyph ? (
                  <ProductLineGlyph
                    kind={glyph}
                    className="text-muted-foreground size-8 shrink-0"
                  />
                ) : null}
                <span className="min-w-0">{item}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function HeroProofPanel({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: HeroSectionProofItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={ariaLabel}
      className="border-border bg-muted/40 mt-6 grid grid-cols-2 gap-2 rounded-xl border p-2 font-mono text-[13px] md:grid-cols-4"
    >
      {items.map((item, index) => (
        <li
          key={`${item.value}-${index}`}
          className="bg-background/70 min-w-0 rounded-lg px-3 py-2"
        >
          <span className="text-foreground block font-semibold break-words">
            {item.value}
          </span>
          {item.label !== undefined ? (
            <span className="text-muted-foreground mt-0.5 block break-words">
              {item.label}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function HeroSectionView({
  content,
  previewTitleId = DEFAULT_PREVIEW_TITLE_ID,
}: HeroSectionViewProps) {
  return (
    <section
      data-testid="hero-section"
      className="relative px-6 py-10 pb-14 md:py-16 md:pb-[72px]"
    >
      <HeroGuideOverlay />
      <div className="relative z-[1] mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <HeroEyebrow text={content.eyebrow} />

          <div>
            <h1 className="mt-4 text-[36px] leading-[1.12] font-semibold text-balance md:text-[46px] md:leading-[1.06]">
              {content.title}
            </h1>
          </div>

          <div>
            <p className="text-muted-foreground mt-4 max-w-[480px] text-lg text-pretty">
              {content.subtitle}
            </p>
          </div>

          <div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={content.primaryCta.href} prefetch={false}>
                  {content.primaryCta.label}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={content.secondaryCta.href} prefetch={false}>
                  {content.secondaryCta.label}
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <HeroProofPanel
              ariaLabel={content.proofAriaLabel}
              items={content.proofItems}
            />
          </div>
        </div>

        <HeroVisual preview={content.preview} previewTitleId={previewTitleId} />
      </div>
    </section>
  );
}
