import type { LinkHref } from "@/lib/i18n/route-parsing";
import { Button } from "@/components/ui/button";
import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";
import { Link } from "@/i18n/routing";

export interface ProductsSectionProductItem {
  id: string;
  tag: string;
  title: string;
  specs: string[];
  meta: string;
  link: LinkHref;
}

export interface ProductsSectionViewProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: LinkHref;
  products: ProductsSectionProductItem[];
}

function ProductCard({
  id,
  tag,
  title,
  specs,
  meta,
  link,
}: ProductsSectionProductItem) {
  return (
    <div className="group surface-card p-6 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 focus-within:-translate-y-0.5">
      <span className="inline-block rounded bg-[var(--primary-light)] px-2.5 py-1 text-xs font-semibold text-primary">
        {tag}
      </span>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {specs.map((spec, index) => (
          <li
            key={`${id}-spec-${String(index)}`}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
            {spec}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-xs font-medium tracking-[0.04em] text-muted-foreground">
          {meta}
        </span>
        <Link
          href={link}
          prefetch={false}
          className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none rounded-sm"
        >
          {title} &rarr;
        </Link>
      </div>
    </div>
  );
}

export function ProductsSectionView({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  products,
}: ProductsSectionViewProps) {
  const action = (
    <Button variant="secondary" asChild>
      <Link href={ctaHref} prefetch={false}>
        {ctaLabel}
      </Link>
    </Button>
  );

  return (
    <HomepageSectionShell
      sectionClassName="section-divider py-14 md:py-[72px]"
      title={title}
      subtitle={subtitle}
      action={action}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </HomepageSectionShell>
  );
}
