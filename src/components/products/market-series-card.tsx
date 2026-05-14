import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getProductMarketPath } from "@/config/paths";

interface MarketSeriesCardProps {
  slug: string;
  label: string;
  description: string;
  standardLabel: string;
  familyCountLabel: string;
}

const MARKET_CARD_IMAGES: Record<string, string> = {
  "north-america": "/images/products/sample-product-a.svg",
  "australia-new-zealand": "/images/products/sample-product-a.svg",
  mexico: "/images/products/sample-product-a.svg",
  europe: "/images/products/sample-product-a.svg",
  "specialty-product-systems": "/images/products/sample-product-b.svg",
};

export function MarketSeriesCard({
  slug,
  label,
  description,
  standardLabel,
  familyCountLabel,
}: MarketSeriesCardProps) {
  const imageSrc =
    MARKET_CARD_IMAGES[slug] ?? "/images/products/sample-product-a.svg";

  return (
    <Link
      href={getProductMarketPath(slug)}
      className="group block rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-md bg-muted">
        <Image
          src={imageSrc}
          alt={label}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <span className="mb-2 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
        {standardLabel}
      </span>
      <h2 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary">
        {label}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      <span className="text-sm text-muted-foreground">{familyCountLabel}</span>
    </Link>
  );
}
