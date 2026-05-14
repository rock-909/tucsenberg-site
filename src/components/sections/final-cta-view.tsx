import type { LinkHref } from "@/lib/i18n/route-parsing";
import { Button } from "@/components/ui/button";
import { HomepageTrustStrip } from "@/components/sections/homepage-trust-strip";
import { Link } from "@/i18n/routing";

interface FinalCtaAction {
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
  primary: FinalCtaAction;
  secondary: FinalCtaAction;
  trustAriaLabel: string;
  trustItems: FinalCtaTrustItem[];
}

export interface FinalCTAViewProps {
  content: FinalCtaContent;
}

export function FinalCTAView({ content }: FinalCTAViewProps) {
  return (
    <section className="bg-primary py-20 md:py-28">
      <div className="mx-auto max-w-[1080px] px-6 text-center">
        <h2 className="text-[36px] font-bold leading-[1.2] tracking-[-0.02em] text-primary-foreground">
          {content.title}
        </h2>

        <p className="mx-auto mt-4 max-w-[560px] text-primary-foreground/90">
          {content.description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="on-dark" size="lg" asChild>
            <Link href={content.primary.href} prefetch={false}>
              <span data-testid="final-cta-primary-label" translate="no">
                {content.primary.label}
              </span>
            </Link>
          </Button>
          <Button variant="ghost-dark" size="lg" asChild>
            <Link href={content.secondary.href} prefetch={false}>
              <span data-testid="final-cta-secondary-label" translate="no">
                {content.secondary.label}
              </span>
            </Link>
          </Button>
        </div>

        <HomepageTrustStrip
          ariaLabel={content.trustAriaLabel}
          className="mt-6 text-[13px]"
          tone="inverse"
          emphasizeValues={false}
          items={content.trustItems}
        />
      </div>
    </section>
  );
}
