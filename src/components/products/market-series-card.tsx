import { Link } from "@/i18n/routing";
import { getProductMarketPath } from "@/config/paths";
import { getTucsenbergProductPage } from "@/constants/tucsenberg-product-pages";
import { ProductLineDiagram } from "@/components/products/product-diagrams";

interface MarketSeriesCardProps {
  slug: string;
  label: string;
  description: string;
  standardLabel: string;
  familyCountLabel: string;
}

export function MarketSeriesCard({
  slug,
  label,
  description,
  standardLabel,
  familyCountLabel,
}: MarketSeriesCardProps) {
  // Engineering line drawing from the product page config — the honest
  // stand-in for photography (copy strategy: 截面图/线图 over stock imagery).
  const diagram = getTucsenbergProductPage(slug)?.diagram;

  return (
    <Link
      href={getProductMarketPath(slug)}
      className="group surface-card focus-visible:ring-ring block p-6 transition-[border-color] duration-150 focus-visible:ring-2 focus-visible:outline-none"
    >
      {diagram ? (
        <div
          aria-hidden
          className="border-border bg-background mb-4 w-full overflow-hidden rounded-md border p-3"
        >
          <ProductLineDiagram kind={diagram.kind} ariaLabel="" />
        </div>
      ) : null}
      <span className="bg-muted text-muted-foreground mb-2 inline-block rounded px-2 py-0.5 font-mono text-xs">
        {standardLabel}
      </span>
      <h2 className="text-foreground group-hover:text-primary mb-2 text-lg font-semibold">
        {label}
      </h2>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      <span className="text-muted-foreground text-sm">{familyCountLabel}</span>
    </Link>
  );
}
