import type { ProductFamilyContactContext } from "@/lib/contact/product-family-context";
import { StatusCallout } from "@/components/ui/status-callout";

export function ProductFamilyContextNotice({
  context,
  label,
}: {
  context: ProductFamilyContactContext | null;
  label: string;
}) {
  if (context === null) {
    return null;
  }

  return (
    <StatusCallout
      className="mb-6"
      data-testid="product-family-context-notice"
      live={false}
      tone="info"
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <span translate="no">{context.marketLabel}</span>
        {" / "}
        <span translate="no">{context.familyLabel}</span>
      </p>
    </StatusCallout>
  );
}
