import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const PRODUCT_OVERVIEW_LEAD_CARD_KEY = "mainOffer" as const;

const PRODUCT_OVERVIEW_SUPPORTING_CARD_KEYS = [
  "proofMaterials",
  "nextStep",
] as const;

const PRODUCT_OVERVIEW_PATH_KEYS = ["scan", "compare", "ask"] as const;

const PRODUCT_DETAIL_UPGRADE_KEYS = [
  "families",
  "comparison",
  "markets",
] as const;

const PRODUCT_BOUNDARY_KEYS = ["content", "assets", "details"] as const;

type ProductOverviewCardKey =
  | typeof PRODUCT_OVERVIEW_LEAD_CARD_KEY
  | (typeof PRODUCT_OVERVIEW_SUPPORTING_CARD_KEYS)[number];
type ProductOverviewPathKey = (typeof PRODUCT_OVERVIEW_PATH_KEYS)[number];
type ProductDetailUpgradeKey = (typeof PRODUCT_DETAIL_UPGRADE_KEYS)[number];
type ProductBoundaryKey = (typeof PRODUCT_BOUNDARY_KEYS)[number];

type ProductsTextKey =
  | "overview.cardsTitle"
  | "overview.cardsDescription"
  | "overview.pathTitle"
  | "overview.pathDescription"
  | "overview.detailTitle"
  | "overview.detailDescription"
  | "overview.boundaryTitle"
  | "overview.boundaryDescription"
  | `overviewCards.${ProductOverviewCardKey}.title`
  | `overviewCards.${ProductOverviewCardKey}.description`
  | `path.items.${ProductOverviewPathKey}.title`
  | `path.items.${ProductOverviewPathKey}.description`
  | `detail.items.${ProductDetailUpgradeKey}`
  | `boundary.items.${ProductBoundaryKey}`;

interface ProductsText {
  (key: ProductsTextKey): string;
}

export function ProductOverviewCards({
  translate,
}: {
  translate: ProductsText;
}) {
  return (
    <section data-section="product-overview-cards" className="mb-16">
      <div className="max-w-2xl">
        <h2 className="text-[32px] font-semibold leading-tight">
          {translate("overview.cardsTitle")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {translate("overview.cardsDescription")}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="surface-card flex flex-col p-6 md:p-8">
          <h3 className="mb-4 text-2xl font-semibold">
            {translate(`overviewCards.${PRODUCT_OVERVIEW_LEAD_CARD_KEY}.title`)}
          </h3>
          <p className="text-base leading-7 text-muted-foreground">
            {translate(
              `overviewCards.${PRODUCT_OVERVIEW_LEAD_CARD_KEY}.description`,
            )}
          </p>
        </article>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {PRODUCT_OVERVIEW_SUPPORTING_CARD_KEYS.map((key) => (
            <article
              key={key}
              className="rounded-3xl border border-border bg-muted/30 p-6"
            >
              <h3 className="mb-3 text-lg font-semibold">
                {translate(`overviewCards.${key}.title`)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {translate(`overviewCards.${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductOverviewPath({
  translate,
}: {
  translate: ProductsText;
}) {
  return (
    <section
      data-section="product-overview-path"
      className="mb-16 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div className="surface-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold">
          {translate("overview.pathTitle")}
        </h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {translate("overview.pathDescription")}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PRODUCT_OVERVIEW_PATH_KEYS.map((key, index) => (
            <div key={key} className="rounded-2xl border border-border p-4">
              <span className="text-xs font-semibold text-[var(--primary-text)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-base font-semibold">
                {translate(`path.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {translate(`path.items.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <aside className="rounded-3xl border border-border bg-muted/30 p-6 md:p-8">
        <h2 className="text-2xl font-semibold">
          {translate("overview.detailTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {translate("overview.detailDescription")}
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
          {PRODUCT_DETAIL_UPGRADE_KEYS.map((key) => (
            <li key={key} className="flex gap-3">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span>{translate(`detail.items.${key}`)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

export function ProductLaunchBoundary({
  translate,
}: {
  translate: ProductsText;
}) {
  return (
    <section
      data-section="product-launch-boundary"
      className="mb-16 surface-card p-6 md:p-8"
    >
      <h2 className="text-2xl font-semibold">
        {translate("overview.boundaryTitle")}
      </h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        {translate("overview.boundaryDescription")}
      </p>
      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {PRODUCT_BOUNDARY_KEYS.map((key) => (
          <li
            key={key}
            className="rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
          >
            {translate(`boundary.items.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductsPageCta({
  showResourcesCta,
  title,
  description,
  resourcesLabel,
  contactLabel,
}: {
  showResourcesCta: boolean;
  title: string;
  description: string;
  resourcesLabel: string;
  contactLabel: string;
}) {
  return (
    <section className="surface-card px-6 py-10 md:px-10 md:py-12">
      <div className="max-w-2xl">
        <h2 className="text-[32px] font-semibold leading-tight">{title}</h2>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {showResourcesCta ? (
          <Button size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.resources}>
              {resourcesLabel}
            </Link>
          </Button>
        ) : null}
        <Button variant="secondary" size="lg" asChild>
          <Link href={SINGLE_SITE_ROUTE_HREFS.contact}>{contactLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
