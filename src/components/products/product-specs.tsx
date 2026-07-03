import { cn } from "@/lib/utils";
import {
  DataCard,
  DataCardContent,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";
export { ProductCertifications } from "@/components/products/product-certifications";
export { ProductTradeInfo } from "@/components/products/product-trade-info";
export type { ProductCertificationsProps } from "@/components/products/product-certifications";
export type { ProductTradeInfoProps } from "@/components/products/product-trade-info";

export interface ProductSpecsProps {
  /** Key-value pairs of product specifications */
  specs: Record<string, string>;
  /** Section title */
  title?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Product specifications display component.
 *
 * Renders a key-value table for product specifications.
 * Commonly used in B2B product pages to show technical details.
 */
export function ProductSpecs({
  specs,
  title = "Specifications",
  className,
}: ProductSpecsProps) {
  const entries = Object.entries(specs);

  if (entries.length === 0) {
    return null;
  }

  return (
    <DataCard className={cn("overflow-hidden", className)}>
      <DataCardHeader className="bg-muted/50">
        <DataCardTitle className="text-lg">{title}</DataCardTitle>
      </DataCardHeader>
      <DataCardContent className="p-0">
        <dl className="divide-y divide-border">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_2fr] gap-4 px-6 py-3 text-sm even:bg-muted/30"
            >
              <dt className="font-medium text-muted-foreground">{key}</dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </DataCardContent>
    </DataCard>
  );
}
