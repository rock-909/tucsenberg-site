import type { ProductFamilyDefinition } from "@/constants/product-catalog";
import type { MarketSpecs } from "@/constants/product-specs/types";
import { FamilySection } from "@/components/products/family-section";
import { buildProductFamilyContactHref } from "@/lib/contact/product-family-context";
import { buildTranslatedFamilySpecs } from "@/app/[locale]/products/[market]/market-spec-presenter";
export { CtaSection } from "@/app/[locale]/products/[market]/cta-section";
export { TrustSignalsSection } from "@/app/[locale]/products/[market]/trust-signals-section";

type CatalogTranslator = (
  key: string,
  values?: Record<string, string>,
) => string;

export function MarketHero({
  standardLabel,
  marketLabel,
  marketDescription,
}: {
  standardLabel: string;
  marketLabel: string;
  marketDescription: string;
}) {
  return (
    <header className="mb-8 md:mb-12">
      <span className="mb-2 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
        {standardLabel}
      </span>
      <h1 className="text-heading mb-4">{marketLabel}</h1>
      <p className="text-body max-w-2xl text-muted-foreground">
        {marketDescription}
      </p>
    </header>
  );
}

export function FamilySections({
  families,
  familySpecsMap,
  marketSlug,
  t,
}: {
  families: readonly ProductFamilyDefinition[];
  familySpecsMap: Map<string, MarketSpecs["families"][number]>;
  marketSlug: string;
  t: CatalogTranslator;
}) {
  let isFirstVisibleFamily = true;

  return families.map((family) => {
    const specs = familySpecsMap.get(family.slug);
    if (!specs) return null;

    const priorityImage = isFirstVisibleFamily;
    isFirstVisibleFamily = false;

    const familyLabel = t(`families.${marketSlug}.${family.slug}.label`);
    const familyDescription = t(
      `families.${marketSlug}.${family.slug}.description`,
    );

    return (
      <FamilySection
        key={family.slug}
        family={family}
        specs={buildTranslatedFamilySpecs({
          specs,
          marketSlug,
          familySlug: family.slug,
          t,
        })}
        familyLabel={familyLabel}
        familyDescription={familyDescription}
        inquiry={{
          href: buildProductFamilyContactHref({
            marketSlug,
            familySlug: family.slug,
          }),
          label: t("market.familyInquiry.cta", { familyLabel }),
          prefetch: false,
        }}
        priorityImage={priorityImage}
      />
    );
  });
}
