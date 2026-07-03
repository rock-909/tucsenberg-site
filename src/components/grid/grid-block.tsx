import { cn } from "@/lib/utils";

interface GridBlockProps {
  children: React.ReactNode;
  /** Grid placement: [colStart, colEnd, rowStart, rowEnd] */
  span: [number, number, number, number];
  className?: string;
}

/**
 * Content block within a GridSection.
 *
 * Sits at z-index:2 above guide cells. Leaves 1px margin on right and bottom
 * edges so guide cell borders peek through the gap.
 */
export function GridBlock({ children, span, className }: GridBlockProps) {
  const [colStart, colEnd, rowStart, rowEnd] = span;

  return (
    <div
      className={cn("relative z-[2] mr-px mb-px", className)}
      style={{
        gridColumn: `${colStart} / ${colEnd + 1}`,
        gridRow: `${rowStart} / ${rowEnd + 1}`,
      }}
    >
      {children}
    </div>
  );
}
