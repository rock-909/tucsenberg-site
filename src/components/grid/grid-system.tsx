import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const CROSSHAIR_SIZE = 21;

/**
 * L-corner crosshair mark at structural anchor points.
 * Two bars (21px each) sharing top-left origin, using border rendering.
 */
export function Crosshair({ style }: { style: CSSProperties }) {
  return (
    <div
      className="pointer-events-none absolute z-[2]"
      style={style}
      aria-hidden="true"
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: CROSSHAIR_SIZE,
          height: 0,
          borderBottom: "1px solid var(--grid-crosshair)",
        }}
      />
      <div
        className="absolute left-0 top-0"
        style={{
          width: 0,
          height: CROSSHAIR_SIZE,
          borderRight: "1px solid var(--grid-crosshair)",
        }}
      />
    </div>
  );
}

interface GridSystemProps {
  children: React.ReactNode;
  /** Crosshair CSS positions — 2-3 per page, sparse and intentional */
  crosshairs?: CSSProperties[];
  className?: string;
}

const EMPTY_CROSSHAIRS: CSSProperties[] = [];

/**
 * Outermost grid wrapper. Draws a 1px border frame and places crosshair marks.
 * Hidden on screens ≤1024px — decorative grid is desktop-only.
 */
export function GridSystem({
  children,
  crosshairs = EMPTY_CROSSHAIRS,
  className,
}: GridSystemProps) {
  return (
    <div className={cn("relative mx-auto max-w-[1080px] px-6", className)}>
      {/* Outer frame — visible only on lg+ */}
      <div
        className="pointer-events-none absolute inset-[-1px] hidden border border-[var(--grid-guide)] lg:block"
        aria-hidden="true"
      />

      {/* Crosshairs — visible only on lg+ */}
      {crosshairs.map((pos, i) => (
        <div key={i} className="hidden lg:block">
          <Crosshair style={pos} />
        </div>
      ))}

      {children}
    </div>
  );
}
