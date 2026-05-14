import type { ComponentProps } from "react";

import { HeroGuideOverlay } from "@/components/grid";
import { HomepageTrustStrip } from "@/components/sections/homepage-trust-strip";
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
  note: string;
}

export interface HeroSectionContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: HeroSectionCta;
  secondaryCta: HeroSectionCta;
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
    <div className="hero-stagger-1 flex items-center gap-2">
      <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-primary">
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
    <div
      data-testid="hero-preview-card"
      aria-labelledby={previewTitleId}
      className="hero-stagger-6 rounded-2xl border border-border bg-card p-5 shadow-border"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-primary">
          {preview.label}
        </span>
        <span className="size-2.5 rounded-full bg-primary" aria-hidden />
      </div>

      <div className="mt-5">
        <h2
          id={previewTitleId}
          className="text-2xl font-bold tracking-[-0.03em] text-foreground"
        >
          {preview.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {preview.description}
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {preview.items.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground"
          >
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-primary">
        {preview.note}
      </p>
    </div>
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
        <div className="flex flex-col">
          <HeroEyebrow text={content.eyebrow} />

          <h1 className="hero-stagger-2 mt-4 text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-[46px] md:leading-[1.04] md:tracking-[-0.04em]">
            {content.title}
          </h1>

          <p className="hero-stagger-3 mt-4 max-w-[480px] text-lg text-muted-foreground">
            {content.subtitle}
          </p>

          <div className="hero-stagger-4 mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={content.primaryCta.href} prefetch={false}>
                {content.primaryCta.label}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={content.secondaryCta.href} prefetch={false}>
                {content.secondaryCta.label}
              </Link>
            </Button>
          </div>

          <HomepageTrustStrip
            ariaLabel="Homepage proof facts"
            className="hero-stagger-5 mt-7 border-t border-border-light pt-5 font-mono text-[13px] text-muted-foreground"
            items={content.proofItems}
          />
        </div>

        <HeroVisual preview={content.preview} previewTitleId={previewTitleId} />
      </div>
    </section>
  );
}
