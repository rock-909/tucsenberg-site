import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";

interface StarterBoundaryItem {
  title: string;
  description: string;
}

interface StarterBoundaryLink {
  label: string;
  href: LinkHref;
}

export interface StarterBoundaryContent {
  title: string;
  description: string;
  listLabel: string;
  items: StarterBoundaryItem[];
  primary: StarterBoundaryLink;
  secondary: StarterBoundaryLink;
}

interface StarterBoundarySectionViewProps {
  content: StarterBoundaryContent;
}

export function StarterBoundarySectionView({
  content,
}: StarterBoundarySectionViewProps) {
  return (
    <HomepageSectionShell
      sectionClassName="section-divider bg-muted/40 py-14 md:py-[72px]"
      title={content.title}
      subtitle={content.description}
    >
      <ul
        aria-label={content.listLabel}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {content.items.map((item) => (
          <li key={item.title} className="rounded-xl border bg-background p-5">
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
        <Link
          href={content.primary.href}
          className="text-primary underline-offset-4 hover:underline"
        >
          {content.primary.label}
        </Link>
        <Link
          href={content.secondary.href}
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {content.secondary.label}
        </Link>
      </div>
    </HomepageSectionShell>
  );
}
