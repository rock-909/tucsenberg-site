import type { LinkHref } from "@/lib/i18n/link-href";
import type { StaticIconComponent } from "@/components/icons/static-icons";
import { Link } from "@/i18n/routing";
import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";

export interface ResourceCardItem {
  Icon: StaticIconComponent;
  title: string;
  desc: string;
  link: LinkHref;
}

export interface ResourcesSectionViewProps {
  title: string;
  subtitle: string;
  resources: ResourceCardItem[];
}

function ResourceCard({ Icon, title, desc, link }: ResourceCardItem) {
  return (
    <Link
      href={link}
      className="group bg-background hover:bg-muted focus-visible:ring-primary flex flex-col gap-3 p-6 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="text-primary flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-light)]">
        <Icon size={20} />
      </div>
      <h3 className="text-[15px] leading-snug font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      <span className="text-primary mt-auto inline-block text-sm font-medium transition-transform duration-150 group-hover:translate-x-1">
        &rarr;
      </span>
    </Link>
  );
}

export function ResourcesSectionView({
  title,
  subtitle,
  resources,
}: ResourcesSectionViewProps) {
  return (
    <HomepageSectionShell
      sectionClassName="section-divider py-14 md:py-[72px]"
      title={title}
      subtitle={subtitle}
    >
      <div className="bg-border overflow-hidden rounded-lg border">
        <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <ResourceCard {...resource} key={resource.title} />
          ))}
        </div>
      </div>
    </HomepageSectionShell>
  );
}
