import { NarrativeSection } from "@/components/trust/narrative-section";

export interface HomeRiskItem {
  key: string;
  title: string;
  body: string;
}

export interface HomeRisksSectionViewProps {
  overline: string;
  title: string;
  body: string;
  items: HomeRiskItem[];
}

export function HomeRisksSectionView({
  overline,
  title,
  body,
  items,
}: HomeRisksSectionViewProps) {
  return (
    <NarrativeSection eyebrow={overline} title={title} body={body}>
      <ol className="grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={item.key}
            className="rounded-[8px] border border-border bg-card p-6 shadow-border"
          >
            <span className="font-mono text-xs font-semibold tracking-[1px] text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-base font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </NarrativeSection>
  );
}
