import { NarrativeSection } from "@/components/trust/narrative-section";
import { Link } from "@/i18n/routing";

export interface HomeMembraneTypeCard {
  key: string;
  name: string;
  body: string;
  href: string;
}

export interface HomeMembraneTypeSectionViewProps {
  overline: string;
  title: string;
  cta: string;
  cards: HomeMembraneTypeCard[];
}

export function HomeMembraneTypeSectionView({
  overline,
  title,
  cta,
  cards,
}: HomeMembraneTypeSectionViewProps) {
  return (
    <NarrativeSection eyebrow={overline} title={title}>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href as "/"}
            className="group rounded-[8px] border border-border bg-card p-6 shadow-border transition-shadow hover:shadow-[0_0_0_1px_var(--color-brand-accent)]"
          >
            <span className="block text-base font-semibold text-foreground">
              {card.name}
            </span>
            <span className="mt-3 block text-sm leading-6 text-muted-foreground">
              {card.body}
            </span>
            <span className="mt-4 block text-sm font-medium text-[var(--color-brand-accent)] group-hover:underline">
              {cta}
            </span>
          </Link>
        ))}
      </div>
    </NarrativeSection>
  );
}
