import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";

interface CtaSectionProps {
  heading: string;
  description: string;
  buttonText: string;
  href: LinkHref;
  prefetch?: boolean;
}

export function CtaSection({
  heading,
  description,
  buttonText,
  href,
  prefetch,
}: CtaSectionProps) {
  return (
    <section className="mt-16">
      <div className="surface-card px-6 py-10 text-center md:px-10 md:py-12">
        <h2 className="text-[32px] font-semibold leading-tight">{heading}</h2>
        <p className="mx-auto mt-4 max-w-[620px] text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href={href} prefetch={prefetch}>
              {buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
