export type TrademarkDisclaimerVariant = "footer" | "brand-notice" | "inline";

export interface TrademarkDisclaimerViewProps {
  variant: TrademarkDisclaimerVariant;
  text: string;
}

const VARIANT_CLASS: Record<TrademarkDisclaimerVariant, string> = {
  footer: "text-xs leading-relaxed text-muted-foreground",
  "brand-notice": "text-xs leading-relaxed text-muted-foreground",
  inline: "text-xs text-muted-foreground",
};

export function TrademarkDisclaimerView({
  variant,
  text,
}: TrademarkDisclaimerViewProps) {
  return (
    <p
      data-testid="trademark-disclaimer"
      data-variant={variant}
      className={VARIANT_CLASS[variant]}
    >
      {text}
    </p>
  );
}
