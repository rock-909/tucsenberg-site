import type { ProductFamilyDefinition } from "@/constants/product-catalog";
import type { MarketSpecs } from "@/constants/product-specs/types";
import { FamilySection } from "@/components/products/family-section";
import {
  ProductCertifications,
  ProductSpecs,
  ProductTradeInfo,
} from "@/components/products/product-specs";
import { Link } from "@/i18n/routing";
import { buildProductFamilyContactHref } from "@/lib/contact/product-family-context";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import {
  buildTranslatedFamilySpecs,
  type MarketTrustSignalsViewModel,
} from "@/app/[locale]/products/[market]/market-spec-presenter";

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

export function TrustSignalsSection({
  translatedTechnical,
  certifications,
  translatedTrade,
  technicalTitle,
  certificationsTitle,
  tradeTitle,
  tradeLabels,
}: MarketTrustSignalsViewModel) {
  return (
    <div className="mt-16 space-y-8">
      <ProductSpecs specs={translatedTechnical} title={technicalTitle} />
      <ProductCertifications
        certifications={certifications}
        title={certificationsTitle}
      />
      <ProductTradeInfo
        moq={translatedTrade.moq}
        leadTime={translatedTrade.leadTime}
        supplyCapacity={translatedTrade.supplyCapacity}
        packaging={translatedTrade.packaging}
        portOfLoading={translatedTrade.portOfLoading}
        title={tradeTitle}
        labels={tradeLabels}
      />
    </div>
  );
}

export function CtaSection({
  heading,
  description,
  buttonText,
  href,
}: {
  heading: string;
  description: string;
  buttonText: string;
  href: LinkHref;
}) {
  return (
    <section className="mt-16 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold">{heading}</h2>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {buttonText}
      </Link>
    </section>
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
  return families.map((family) => {
    const specs = familySpecsMap.get(family.slug);
    if (!specs) return null;

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
        }}
      />
    );
  });
}
