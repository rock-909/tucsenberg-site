import { heroGuides } from "@/components/grid/grid-section";

const HERO_COLS = 12;
const HERO_ROWS = 8;

const guides = heroGuides(HERO_COLS, HERO_ROWS);

/**
 * 12×8 fade-out grid overlay for the Hero section.
 * Positioned absolute within the Hero, centered at 1080px.
 * Desktop-only decorative element.
 */
export function HeroGuideOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-0 hidden -translate-x-1/2 lg:block"
      style={{
        maxWidth: "1080px",
        width: "calc(100% - 48px)",
        display: "grid",
        gridTemplateColumns: `repeat(${HERO_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${HERO_ROWS}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {guides.map((guide) => (
        <div
          key={`${guide.column}-${guide.row}`}
          className={[
            "pointer-events-none",
            guide.borderRight ? "border-r border-[var(--grid-guide)]" : "",
            guide.borderBottom ? "border-b border-[var(--grid-guide)]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            gridColumn: guide.column,
            gridRow: guide.row,
          }}
        />
      ))}
    </div>
  );
}
