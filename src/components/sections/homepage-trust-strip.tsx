import { cn } from "@/lib/utils";

export interface HomepageTrustStripItem {
  key?: string;
  value: string;
  label?: string;
}

export interface HomepageTrustStripProps {
  ariaLabel: string;
  items: HomepageTrustStripItem[];
  className?: string;
  tone?: "default" | "inverse";
  emphasizeValues?: boolean;
}

export function HomepageTrustStrip({
  ariaLabel,
  items,
  className,
  tone = "default",
  emphasizeValues = true,
}: HomepageTrustStripProps) {
  if (items.length === 0) {
    return null;
  }

  const valueClassName = cn(
    tone === "inverse" ? "text-primary-foreground/90" : "text-foreground",
    emphasizeValues ? "font-semibold" : "font-normal",
  );
  const labelClassName =
    tone === "inverse" ? "text-primary-foreground/90" : "text-muted-foreground";
  const separatorClassName =
    tone === "inverse" ? "text-primary-foreground/25" : "text-border";

  return (
    <ul
      aria-label={ariaLabel}
      className={cn("flex flex-wrap items-center gap-y-1", className)}
    >
      {items.map((item, index) => (
        <li
          key={item.key ?? `${item.value}-${index}`}
          className="flex items-center"
        >
          <span className={valueClassName}>{item.value}</span>
          {item.label !== undefined ? (
            <span className={cn("ml-1", labelClassName)}>{item.label}</span>
          ) : null}
          {index < items.length - 1 ? (
            <span aria-hidden="true" className={cn("mx-5", separatorClassName)}>
              ·
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
