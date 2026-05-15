import type { SpecGroup } from "@/constants/product-specs/types";
import { cn } from "@/lib/utils";
import {
  DataCard,
  DataCardContent,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";

export interface SpecTableProps {
  specGroups: SpecGroup[];
  className?: string;
}

function SpecRow({ row }: { row: string[] }) {
  return (
    <tr className="border-b border-border last:border-0 even:bg-muted/30">
      {row.map((cell, cellIdx) => (
        <td key={cellIdx} className="px-4 py-2.5 font-mono text-foreground">
          {cell}
        </td>
      ))}
    </tr>
  );
}

function SpecGroupTable({ group }: { group: SpecGroup }) {
  return (
    <DataCard className="gap-3 p-4">
      <DataCardHeader>
        <DataCardTitle className="font-mono text-sm text-muted-foreground">
          {group.groupLabel}
        </DataCardTitle>
      </DataCardHeader>
      <DataCardContent className="overflow-x-auto rounded-lg border border-border p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {group.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row, rowIdx) => (
              <SpecRow key={rowIdx} row={row} />
            ))}
          </tbody>
        </table>
      </DataCardContent>
    </DataCard>
  );
}

export function SpecTable({ specGroups, className }: SpecTableProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {specGroups.map((group) => (
        <SpecGroupTable key={group.groupLabel} group={group} />
      ))}
    </div>
  );
}
