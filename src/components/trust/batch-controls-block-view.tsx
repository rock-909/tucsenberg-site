export interface BatchControlsBlockViewProps {
  title: string;
  traceability: string;
  photos: string;
  sample: string;
}

export function BatchControlsBlockView({
  title,
  traceability,
  photos,
  sample,
}: BatchControlsBlockViewProps) {
  return (
    <div
      data-testid="batch-controls-block"
      className="rounded-[8px] border border-border bg-card p-6"
    >
      <h3 className="type-heading-03">{title}</h3>
      <ul className="mt-4 flex list-none flex-col gap-3 p-0 text-sm text-muted-foreground">
        <li>{traceability}</li>
        <li>{photos}</li>
        <li>{sample}</li>
      </ul>
    </div>
  );
}
