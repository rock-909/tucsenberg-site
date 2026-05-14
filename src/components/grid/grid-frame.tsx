import type { CSSProperties } from "react";

import { Crosshair } from "@/components/grid/grid-system";

interface GridFrameProps {
  children: React.ReactNode;
  /** Crosshair CSS positions — 2-3 per page, sparse and intentional */
  crosshairs?: CSSProperties[];
}

const EMPTY_CROSSHAIRS: CSSProperties[] = [];

/**
 * Detect crosshair corner from its CSS position and return the rotation
 * needed so the L-shape points inward. The Crosshair component draws
 * bars extending right+down from origin; rotating flips the direction.
 */
function getCrosshairRotation(pos: CSSProperties): string {
  const hasBottom = "bottom" in pos;
  const hasRight = "right" in pos;
  if (hasBottom && hasRight) return "rotate(180deg)";
  if (hasBottom) return "rotate(-90deg)";
  if (hasRight) return "rotate(90deg)";
  return "rotate(0deg)";
}

/**
 * Page-level decorative frame with 1px border + crosshair marks.
 * Does NOT constrain children — sections flow normally beneath.
 * Hidden on screens < lg (decorative grid is desktop-only).
 */
export function GridFrame({
  children,
  crosshairs = EMPTY_CROSSHAIRS,
}: GridFrameProps) {
  return (
    <div className="relative">
      {/* Outer frame — centered 1080px border, desktop only */}
      <div
        className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
        aria-hidden="true"
      >
        <div
          className="mx-auto h-full border border-[var(--grid-guide)]"
          style={{
            maxWidth: "calc(min(1080px, 100% - 48px) + 2px)",
          }}
        />
      </div>

      {/* Crosshairs — desktop only, inset-0 so inner Crosshair can anchor to any corner */}
      {crosshairs.map((pos, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-y-0 z-20 hidden lg:block"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(1080px, calc(100% - 48px))",
          }}
          aria-hidden="true"
        >
          <Crosshair style={{ ...pos, transform: getCrosshairRotation(pos) }} />
        </div>
      ))}

      {children}
    </div>
  );
}
