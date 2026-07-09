import type { LinkHref } from "@/lib/i18n/link-href";
import { Button } from "@/components/ui/button";
import { HomepageTrustStrip } from "@/components/sections/homepage-trust-strip";
import { Link } from "@/i18n/routing";

export interface FinalCtaAction {
  label: string;
  href: LinkHref;
}

export interface FinalCtaTrustItem {
  key: string;
  value: string;
  label?: string;
}

export interface FinalCtaContent {
  title: string;
  description: string;
  primary?: FinalCtaAction;
  secondary?: FinalCtaAction;
  trustAriaLabel: string;
  trustItems: FinalCtaTrustItem[];
}

export interface FinalCTAViewProps {
  content: FinalCtaContent;
}

export function FinalCTAView({ content }: FinalCTAViewProps) {
  return (
    <section className="section-divider px-6 py-14 md:py-[72px]">
      <div className="mx-auto max-w-[1080px]">
        <div className="surface-card px-6 py-10 text-center md:px-10 md:py-12">
          <h2 className="text-[32px] leading-tight font-semibold md:text-[36px]">
            {content.title}
          </h2>

          <p className="text-muted-foreground mx-auto mt-4 max-w-[620px]">
            {content.description}
          </p>

          {(content.primary || content.secondary) && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {content.primary ? (
                <Button size="lg" asChild>
                  <Link href={content.primary.href} prefetch={false}>
                    <span data-testid="final-cta-primary-label" translate="no">
                      {content.primary.label}
                    </span>
                  </Link>
                </Button>
              ) : null}
              {content.secondary ? (
                <Button variant="secondary" size="lg" asChild>
                  <Link href={content.secondary.href} prefetch={false}>
                    <span
                      data-testid="final-cta-secondary-label"
                      translate="no"
                    >
                      {content.secondary.label}
                    </span>
                  </Link>
                </Button>
              ) : null}
            </div>
          )}

          <HomepageTrustStrip
            ariaLabel={content.trustAriaLabel}
            className="mt-6 justify-center text-[13px]"
            emphasizeValues={false}
            items={content.trustItems}
          />
        </div>
      </div>
    </section>
  );
}
