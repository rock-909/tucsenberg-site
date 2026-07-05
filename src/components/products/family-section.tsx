import Image from "next/image";
import { siteFacts } from "@/config/site-facts";
import type { ProductFamilyDefinition } from "@/constants/product-catalog";
import type { FamilySpecs } from "@/constants/product-specs/types";
import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import { cn } from "@/lib/utils";
import { SpecTable } from "@/components/products/spec-table";
import { Button } from "@/components/ui/button";

const FALLBACK_PRODUCT_IMAGE =
  "/profile-fixtures/catalog/products/sample-product-a.svg";

function resolveProductImage(images: readonly string[]) {
  const firstImage = images[0];

  if (
    siteFacts.brandAssets.productPhotos.status !== "ready" ||
    !firstImage ||
    firstImage.includes("placeholder")
  ) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  return firstImage;
}

export interface FamilySectionProps {
  family: ProductFamilyDefinition;
  specs: FamilySpecs;
  familyLabel: string;
  familyDescription: string;
  inquiry?: {
    href: LinkHref;
    label: string;
    prefetch?: boolean;
  };
  priorityImage?: boolean;
  className?: string;
}

export function FamilySection({
  family,
  specs,
  familyLabel,
  familyDescription,
  inquiry,
  priorityImage = false,
  className,
}: FamilySectionProps) {
  const firstImage = resolveProductImage(specs.images);

  return (
    <section id={family.slug} className={cn("py-12", className)}>
      {/* Desktop: two-column split; Mobile: vertical stack */}
      <div className="mb-8 flex flex-col gap-8 md:flex-row md:items-start">
        {/* Image area — left column on desktop */}
        <div className="border-border bg-muted relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border md:w-1/2">
          <Image
            src={firstImage}
            alt={familyLabel}
            fill
            preload={priorityImage}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
          />
        </div>

        {/* Overview — right column on desktop */}
        <div className="flex flex-col gap-4 md:w-1/2">
          <h2 className="text-foreground text-2xl font-semibold">
            {familyLabel}
          </h2>
          <p className="text-muted-foreground">{familyDescription}</p>

          {/* Key highlights */}
          <ul className="space-y-2">
            {specs.highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2 text-sm">
                <span
                  className="border-border bg-muted text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          {inquiry ? (
            <Button asChild className="w-fit">
              <Link href={inquiry.href} prefetch={inquiry.prefetch}>
                {inquiry.label}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Spec table — full width below the split */}
      <SpecTable specGroups={specs.specGroups} />
    </section>
  );
}
