import type { ProductFamilyContactContext } from "@/lib/contact/product-family-context";

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
    <div
      className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4"
      data-testid="product-family-context-notice"
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <span translate="no">{context.marketLabel}</span>
        {" / "}
        <span translate="no">{context.familyLabel}</span>
      </p>
    </div>
  );
}
