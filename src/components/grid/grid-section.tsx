import { cn } from "@/lib/utils";

interface GuideConfig {
  column: number;
  row: number;
  borderRight: boolean;
  borderBottom: boolean;
}

interface GridSectionProps {
  children: React.ReactNode;
  /** Number of grid columns */
  columns: number;
  /** Number of grid rows */
  rows: number;
  /** Which guide cells show borders — empty = no visible guides */
  guides?: GuideConfig[];
  /** Section divider: border-top or border-bottom on the grid element */
  divider?: "top" | "bottom" | "both" | "none";
  className?: string;
}

const EMPTY_GUIDES: GuideConfig[] = [];

/**
 * Generate hero-style guide configs with fade-out effect.
 * Row 1 has full borders, progressively fewer as rows increase.
 */
export function heroGuides(cols: number, rows: number): GuideConfig[] {
  const guides: GuideConfig[] = [];
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const fadeThreshold = Math.max(1, rows - row);
      const showRight = col < cols && row <= fadeThreshold;
      const showBottom = row <= fadeThreshold + 1;
      if (showRight || showBottom) {
        guides.push({
          column: col,
          row,
          borderRight: showRight,
          borderBottom: showBottom,
        });
      }
    }
  }
  return guides;
}

/**
 * A grid section with optional decorative guide lines.
 *
 * Uses CSS Grid. Guide cells sit at z-index:1; content blocks (GridBlock) at z-index:2.
 * Guide borders only appear on desktop (>1024px) — hidden via Tailwind `lg:` prefix.
 */
export function GridSection({
  children,
  columns,
  rows,
  guides = EMPTY_GUIDES,
  divider = "none",
  className,
}: GridSectionProps) {
  const dividerClasses = {
    top: "border-t border-[var(--grid-divider)]",
    bottom: "border-b border-[var(--grid-divider)]",
    both: "border-y border-[var(--grid-divider)]",
    none: "",
  };

  return (
    <section
      className={cn("relative", dividerClasses[divider], className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {/* Guide cells — decorative, desktop only */}
      {guides.map((guide) => (
        <div
          key={`${guide.column}-${guide.row}`}
          className={cn(
            "pointer-events-none z-[1] hidden lg:block",
            guide.borderRight && "border-r border-[var(--grid-guide)]",
            guide.borderBottom && "border-b border-[var(--grid-guide)]",
          )}
          style={{
            gridColumn: guide.column,
            gridRow: guide.row,
          }}
          aria-hidden="true"
        />
      ))}

      {children}
    </section>
  );
}
