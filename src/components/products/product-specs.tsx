import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
      </CardContent>
    </Card>
  );
}

export interface ProductCertificationsProps {
  /** List of certification names */
  certifications: string[];
  /** Section title */
  title?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Product certifications display component.
 *
 * Renders a list of certification badges (ISO, CE, etc.).
 * Important for B2B buyers to verify compliance.
 */
export function ProductCertifications({
  certifications,
  title = "Certifications",
  className,
}: ProductCertificationsProps) {
  if (certifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {title !== "" && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => (
          <Badge key={cert} variant="outline" className="text-sm">
            {cert}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export interface ProductTradeInfoProps {
  /** Minimum order quantity */
  moq?: string;
  /** Lead/delivery time */
  leadTime?: string;
  /** Supply/production capacity */
  supplyCapacity?: string;
  /** Packaging information */
  packaging?: string;
  /** Port of loading */
  portOfLoading?: string;
  /** Localized labels */
  labels?: {
    moq?: string;
    leadTime?: string;
    supplyCapacity?: string;
    packaging?: string;
    portOfLoading?: string;
  };
  /** Section title */
  title?: string;
  /** Custom class name */
  className?: string;
}

const DEFAULT_TRADE_LABELS = {
  moq: "Minimum Order",
  leadTime: "Lead Time",
  supplyCapacity: "Supply Capacity",
  packaging: "Packaging",
  portOfLoading: "Port of Loading",
};

/**
 * Product trade information display component.
 *
 * Renders foreign trade specific information in a structured format.
 * Essential for B2B product pages.
 */
export function ProductTradeInfo({
  moq,
  leadTime,
  supplyCapacity,
  packaging,
  portOfLoading,
  labels = DEFAULT_TRADE_LABELS,
  title = "Trade Information",
  className,
}: ProductTradeInfoProps) {
  // nosemgrep: object-injection-sink-spread-operator
  // Reason: DEFAULT_TRADE_LABELS and labels are controlled trade info label
  // mappings for UI display only. They never carry user input or flow into
  // security-sensitive operations.
  const mergedLabels = { ...DEFAULT_TRADE_LABELS, ...labels };

  const items = [
    { key: "moq", label: mergedLabels.moq, value: moq },
    { key: "leadTime", label: mergedLabels.leadTime, value: leadTime },
    {
      key: "supplyCapacity",
      label: mergedLabels.supplyCapacity,
      value: supplyCapacity,
    },
    { key: "packaging", label: mergedLabels.packaging, value: packaging },
    {
      key: "portOfLoading",
      label: mergedLabels.portOfLoading,
      value: portOfLoading,
    },
  ].filter((item) => item.value !== undefined);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <dl className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-[1fr_2fr] gap-4 px-6 py-3 text-sm even:bg-muted/30"
            >
              <dt className="font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
