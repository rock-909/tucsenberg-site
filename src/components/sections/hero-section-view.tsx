import type { ComponentProps } from "react";

import { HeroGuideOverlay } from "@/components/grid/hero-guide-overlay";
import { Button } from "@/components/ui/button";
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
      <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
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
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {preview.label}
          </span>
          <span
            className="size-2.5 rounded-full bg-foreground/40"
            aria-hidden
          />
        </div>

        <div className="mt-5 min-w-0">
          <h2
            id={previewTitleId}
            className="text-balance text-2xl font-semibold text-foreground"
          >
            {preview.title}
          </h2>
          <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
            {preview.description}
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-2 md:gap-3">
          {preview.items.map((item) => (
            <li
              key={item}
              className="min-w-0 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium break-words text-foreground"
            >
              {item}
            </li>
          ))}
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
      className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/40 p-2 font-mono text-[13px] md:grid-cols-4"
    >
      {items.map((item, index) => (
        <li
          key={`${item.value}-${index}`}
          className="min-w-0 rounded-lg bg-background/70 px-3 py-2"
        >
          <span className="block break-words font-semibold text-foreground">
            {item.value}
          </span>
          {item.label !== undefined ? (
            <span className="mt-0.5 block break-words text-muted-foreground">
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
            <h1 className="mt-4 text-balance text-[36px] font-semibold leading-[1.12] md:text-[46px] md:leading-[1.06]">
              {content.title}
            </h1>
          </div>

          <div>
            <p className="mt-4 max-w-[480px] text-pretty text-lg text-muted-foreground">
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
