export interface CompatibilityProofBoxViewProps {
  title: string;
  body: string;
  extraChecks?: readonly string[];
}

export function CompatibilityProofBoxView({
  title,
  body,
  extraChecks,
}: CompatibilityProofBoxViewProps) {
  return (
    <div
      data-testid="compatibility-proof-box"
      className="rounded-[8px] border border-border bg-card p-6"
    >
      <h3 className="type-heading-03">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {extraChecks && extraChecks.length > 0 ? (
        <ul className="mt-4 flex list-none flex-col gap-2 p-0 text-sm text-muted-foreground">
          {extraChecks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
