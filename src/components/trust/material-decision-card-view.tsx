export type MaterialDecisionDefault = "epdm" | "tpu";

export interface MaterialDecisionCardViewProps {
  title: string;
  epdmLabel: string;
  epdmCondition: string;
  tpuLabel: string;
  tpuCondition: string;
  note: string;
  defaultMaterial: MaterialDecisionDefault;
}

export function MaterialDecisionCardView({
  title,
  epdmLabel,
  epdmCondition,
  tpuLabel,
  tpuCondition,
  note,
  defaultMaterial,
}: MaterialDecisionCardViewProps) {
  return (
    <div
      data-testid="material-decision-card"
      data-default-material={defaultMaterial}
      className="rounded-[8px] border border-border bg-card p-6"
    >
      <h3 className="type-heading-03">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div data-material="epdm">
          <dt className="text-sm font-semibold text-foreground">{epdmLabel}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">
            {epdmCondition}
          </dd>
        </div>
        <div data-material="tpu">
          <dt className="text-sm font-semibold text-foreground">{tpuLabel}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{tpuCondition}</dd>
        </div>
      </dl>
      <p data-material-note className="mt-4 text-sm text-muted-foreground">
        {note}
      </p>
    </div>
  );
}
