export type MaterialDecisionDefault = "epdm" | "tpu";

export interface MaterialDecisionCardViewProps {
  title: string;
  epdmLabel: string;
  epdmBody: string;
  tpuLabel: string;
  tpuBody: string;
  defaultMaterial: MaterialDecisionDefault;
}

export function MaterialDecisionCardView({
  title,
  epdmLabel,
  epdmBody,
  tpuLabel,
  tpuBody,
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
          <dd className="mt-1 text-sm text-muted-foreground">{epdmBody}</dd>
        </div>
        <div data-material="tpu">
          <dt className="text-sm font-semibold text-foreground">{tpuLabel}</dt>
          <dd className="mt-1 text-sm text-muted-foreground">{tpuBody}</dd>
        </div>
      </dl>
    </div>
  );
}
