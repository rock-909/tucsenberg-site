import { cn } from "@/lib/utils";

export interface StickyFamilyNavProps {
  families: { slug: string; label: string }[];
  ariaLabel?: string;
  className?: string;
}

export function StickyFamilyNav({
  families,
  ariaLabel = "Product families",
  className,
}: StickyFamilyNavProps) {
  return (
    <nav
      className={cn(
        "sticky top-14 z-10 -mx-6 mb-8 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex gap-1 overflow-x-auto py-2">
        {families.map((family) => (
          <a
            key={family.slug}
            href={`#${family.slug}`}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {family.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
