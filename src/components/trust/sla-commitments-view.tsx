import { cn } from "@/lib/utils";

export type SlaCommitmentsLayout = "ribbon" | "stacked";

export interface SlaCommitmentsViewProps {
  layout: SlaCommitmentsLayout;
  commitments: readonly string[];
}

const LAYOUT_CLASS: Record<SlaCommitmentsLayout, string> = {
  ribbon: "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6",
  stacked: "flex flex-col gap-3",
};

export function SlaCommitmentsView({
  layout,
  commitments,
}: SlaCommitmentsViewProps) {
  return (
    <ul
      data-testid="sla-commitments"
      data-layout={layout}
      className={cn("m-0 list-none p-0", LAYOUT_CLASS[layout])}
    >
      {commitments.map((commitment) => (
        <li
          key={commitment}
          data-testid="sla-commitment"
          className="text-sm text-muted-foreground"
        >
          {commitment}
        </li>
      ))}
    </ul>
  );
}
