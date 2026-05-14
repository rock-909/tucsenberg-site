import Image from "next/image";
import type { ProductFamilyDefinition } from "@/constants/product-catalog";
import type { FamilySpecs } from "@/constants/product-specs/types";
import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import { cn } from "@/lib/utils";
import { SpecTable } from "@/components/products/spec-table";

export interface FamilySectionProps {
  family: ProductFamilyDefinition;
  specs: FamilySpecs;
  familyLabel: string;
  familyDescription: string;
  inquiry?: {
    href: LinkHref;
    label: string;
  };
  className?: string;
}

export function FamilySection({
  family,
  specs,
  familyLabel,
  familyDescription,
  inquiry,
  className,
}: FamilySectionProps) {
  const firstImage = specs.images[0] ?? "/images/products/sample-product-a.svg";

  return (
    <section id={family.slug} className={cn("py-12", className)}>
      {/* Desktop: two-column split; Mobile: vertical stack */}
      <div className="mb-8 flex flex-col gap-8 md:flex-row md:items-start">
        {/* Image area — left column on desktop */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:w-1/2">
          <Image
            src={firstImage}
            alt={familyLabel}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
          />
        </div>

        {/* Overview — right column on desktop */}
        <div className="flex flex-col gap-4 md:w-1/2">
          <h2 className="text-2xl font-semibold text-foreground">
            {familyLabel}
          </h2>
          <p className="text-muted-foreground">{familyDescription}</p>

          {/* Key highlights */}
          <ul className="space-y-2">
            {specs.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2 text-sm">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          {inquiry ? (
            <Link
              href={inquiry.href}
              className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {inquiry.label}
            </Link>
          ) : null}
        </div>
      </div>

      {/* Spec table — full width below the split */}
      <SpecTable specGroups={specs.specGroups} />
    </section>
  );
}
