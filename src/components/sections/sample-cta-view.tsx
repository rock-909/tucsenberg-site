import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import { Button } from "@/components/ui/button";

export interface SampleCtaContent {
  title: string;
  description: string;
  cta: {
    label: string;
    href: LinkHref;
  };
}

export interface SampleCTAViewProps {
  content: SampleCtaContent;
}

export function SampleCTAView({ content }: SampleCTAViewProps) {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="flex flex-col items-start gap-6 surface-card p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-[28px] font-semibold leading-tight md:text-[32px]">
              {content.title}
            </h2>
            <p className="mt-2 max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={content.cta.href} prefetch={false}>
              <span data-testid="sample-cta-label" translate="no">
                {content.cta.label}
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
