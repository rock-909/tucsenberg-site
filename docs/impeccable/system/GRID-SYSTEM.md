# Grid Layout System

> Editorial CSS Grid approach adapted for showcase website layouts.
> External vendor reference files have been removed from the live starter tree.

## Architecture

The grid lines are **not a decorative overlay** — they are the layout system itself.

```
┌─ .grid-system ──────────────────────────────┐
│  ::before (1px border frame)                 │
│                                              │
│  ┌─ section.grid ──────────────────────────┐ │
│  │  display: grid                          │ │
│  │  grid-template-columns: repeat(N, 1fr)  │ │
│  │  grid-template-rows: repeat(M, 1fr)     │ │
│  │                                         │ │
│  │  ┌─ .guide ──┐ ┌─ .guide ──┐           │ │
│  │  │ z-index:1  │ │ z-index:1  │          │ │
│  │  │ border-R ─┼─┤ border-R ─┼─          │ │
│  │  │ border-B ─┼─┤ border-B ─┼─          │ │
│  │  └───────────┘ └───────────┘            │ │
│  │                                         │ │
│  │  ┌─ .block (content) ──────────────┐    │ │
│  │  │ z-index: 2                      │    │ │
│  │  │ margin-right: 1px ──┐ guide     │    │ │
│  │  │ margin-bottom: 1px ─┘ borders   │    │ │
│  │  │                     peek thru   │    │ │
│  │  └─────────────────────────────────┘    │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  .cross (at anchor points, z-index: 2)       │
└──────────────────────────────────────────────┘
```

### Key Principle

Content blocks sit **on top of** guide cells (z-index: 2 vs 1) but leave a `1px` margin on right and bottom edges. Guide cell borders show through this gap. Lines and content are **one system**, not two layers.

## Specifications

### Container

| Property | Value | Note |
|----------|-------|------|
| Max width | `1080px` | Starter grid standard (prototype used 1140px) |
| Horizontal margin | `auto` | Centered |
| Horizontal padding | `24px` | Inside container |

### Grid Cell

| Property | Value |
|----------|-------|
| Base cell size | ~90px (= 1080 / 12) |
| Guide border width | `1px` |
| Guide border style | `solid` |
| Guide border color | `rgba(0, 0, 0, 0.05)` |
| Guide border sides | `border-right` and `border-bottom` only (no top/left) |

### Section Configurations

Each section defines its own grid dimensions. Content determines the grid, not the other way around.

| Section | Columns | Rows | Cell ≈ | Notes |
|---------|---------|------|--------|-------|
| Hero | 12 | 8 | 90px | Dense grid, most guides have borders |
| Product features | 3 | 2 | 360px | Only column dividers visible |
| CTA / headline | 3 | 1 | 360px | Minimal lines |
| Footer | 3 | 3 | 360px | Framework grid |

### Border Visibility Rules

NOT all guide cells show borders. Borders are **selectively applied per cell** via inline styles.

**Hero section pattern:**
- Row 1: All 11 cells have `border-right` (col 12 has none — last column)
- Row 1: All 12 cells have `border-bottom`
- Row 2+: Progressive reduction — fewer cells show borders deeper in the section
- Creates a **fade-out effect** from top to bottom

**Other sections:**
- Guides have `border-right: none; border-bottom: none` (invisible)
- Lines come from the section element's own `border-top` or `border-bottom`

### Section Dividers

| Property | Value | Note |
|----------|-------|------|
| Border | `1px solid rgb(235, 235, 235)` | Darker than guide lines (~0.08 opacity) |
| Applied as | `border-top` or `border-bottom` on section `.grid` element | Not separate HTML elements |

### Crosshairs

| Property | Value |
|----------|-------|
| Total count | 2–3 per page (sparse, intentional) |
| Placement | Asymmetric — structural anchor points, NOT every section boundary |
| Line dimensions | 11px × 21px (vertical bar), 21px × 11px (horizontal bar) |
| Shape | L-corner mark (two bars sharing top-left origin), not a full "+" |
| Color | `rgb(168, 168, 168)` — significantly darker than grid lines |
| Construction | Two child `div`s, each using single `border-right` or `border-bottom` |
| z-index | 2 (above guides) |

**Suggested starter positions:**
1. Top-left of hero grid — section origin
2. Bottom-right of final content section — page conclusion anchor

### Outer Frame

The `.gridSystem` container draws a 1px border frame around the entire grid area using `::before`:

```css
.gridSystem::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--guide-width));
  border: var(--guide-width) solid var(--guide-color);
  pointer-events: none;
}
```

## Responsive Behavior

| Breakpoint | Grid Changes |
|------------|-------------|
| >1024px | Full grid system visible |
| ≤1024px | Grid system hidden (guides, crosshairs, frame — all removed) |
| ≤768px | Standard responsive layout, no decorative grid |

## Implementation Notes

### React Component Structure

```
<GridSystem>              → outer frame + crosshairs
  <GridSection            → display: grid, columns/rows config
    columns={12}
    rows={8}
    guides={guidesConfig}  → which cells show borders
  >
    <GridBlock span={[1,12,1,4]}>  → grid-column/row placement
      {children}
    </GridBlock>
  </GridSection>
</GridSystem>
```

### Guide Config Format

Each section needs a config specifying which cells show borders:

```typescript
interface GuideConfig {
  column: number;
  row: number;
  borderRight: boolean;
  borderBottom: boolean;
}
```

For the hero, generate programmatically with fade-out logic:

```typescript
function heroGuides(cols: number, rows: number): GuideConfig[] {
  return Array.from({ length: cols * rows }, (_, i) => {
    const col = (i % cols) + 1;
    const row = Math.floor(i / cols) + 1;
    // Fade: fewer borders as row increases
    const showRight = col < cols && row <= Math.max(1, rows - row);
    const showBottom = row <= Math.max(1, rows - row + 1);
    return { column: col, row, borderRight: showRight, borderBottom: showBottom };
  });
}
```

### What NOT to Do

- Do NOT use `position: fixed` background overlay for grid lines
- Do NOT use `background-image: repeating-linear-gradient()` for vertical lines
- Do NOT insert separate HTML elements between sections for dividers
- Do NOT place crosshairs at every section boundary
- Do NOT use uniform line opacity — use the three-tier system (guide 0.05, divider 0.08, crosshair ~0.66)

## Reference Files

| File | Purpose |
|------|---------|
| `docs/impeccable/system/COLOR-SYSTEM.md` | Current color system |
| `docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md` | Section redesign checklist |
| Git history | Archived external reference snapshots, if future design archaeology needs them |
