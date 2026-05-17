import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface NarrativeSectionCta {
  label: string;
  href: string;
}

export interface NarrativeSectionProps {
  eyebrow?: string;
  title: string;
  body?: string;
  cta?: NarrativeSectionCta;
  children?: ReactNode;
  divider?: boolean;
}

/**
 * Synchronous narrative shell. The caller passes already-resolved strings —
 * this component does not load i18n. It mirrors the `faq-section-view`
 * `section-divider` divider-class usage so stacked narrative blocks share a
 * single top border rhythm.
 */
export function NarrativeSection({
  eyebrow,
  title,
  body,
  cta,
  children,
  divider = true,
}: NarrativeSectionProps) {
  return (
    <section className={cn(divider && "section-divider", "py-14 md:py-[72px]")}>
      <div className="mx-auto max-w-[1080px] px-6">
        {eyebrow ? (
          <span className="block text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="type-heading-02 mt-2">{title}</h2>
        {body ? (
          <p className="mt-4 max-w-[640px] text-muted-foreground">{body}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
        {cta ? (
          <div className="mt-6">
            <Button asChild>
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
