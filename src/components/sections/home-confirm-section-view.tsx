import { NarrativeSection } from "@/components/trust/narrative-section";

export interface HomeConfirmPoint {
  key: string;
  title: string;
  body: string;
}

export interface HomeConfirmSectionViewProps {
  overline: string;
  title: string;
  body: string;
  points: HomeConfirmPoint[];
}

export function HomeConfirmSectionView({
  overline,
  title,
  body,
  points,
}: HomeConfirmSectionViewProps) {
  return (
    <NarrativeSection eyebrow={overline} title={title} body={body}>
      <div className="grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <article
            key={point.key}
            className="rounded-[8px] border border-border bg-card p-6 shadow-border"
          >
            <h3 className="text-base font-semibold text-foreground">
              {point.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {point.body}
            </p>
          </article>
        ))}
      </div>
    </NarrativeSection>
  );
}
