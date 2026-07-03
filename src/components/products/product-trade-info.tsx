import { cn } from "@/lib/utils";
import {
  DataCard,
  DataCardContent,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";

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
    <DataCard className={cn("overflow-hidden", className)}>
      <DataCardHeader className="bg-muted/50">
        <DataCardTitle className="text-lg">{title}</DataCardTitle>
      </DataCardHeader>
      <DataCardContent className="p-0">
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
      </DataCardContent>
    </DataCard>
  );
}
