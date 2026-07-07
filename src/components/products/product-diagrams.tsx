/* eslint-disable no-magic-numbers -- SVG drawing coordinates; naming every x/y would hurt readability */
import type { ReactNode } from "react";
import type {
  TucsenbergProductDiagram,
  TucsenbergProductDiagramKind,
} from "@/constants/tucsenberg-product-page-types";
import { BoxwallCrossSection } from "@/components/products/boxwall-cross-section";

/**
 * Honest engineering line drawings (copy strategy: 截面图/线图 over stock
 * imagery until owner photos land). All strokes inherit theme tokens via
 * currentColor so light/dark both stay readable.
 */

function DiagramSvg({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <svg
      aria-label={ariaLabel}
      className="h-auto w-full"
      fill="none"
      role="img"
      viewBox="0 0 480 320"
    >
      {children}
    </svg>
  );
}

function GroundLine({ y = 260 }: { y?: number }) {
  return (
    <g className="text-foreground/70" stroke="currentColor" strokeWidth={2}>
      <line x1={24} y1={y} x2={456} y2={y} />
      {Array.from({ length: 14 }, (_, i) => 40 + i * 30).map((x) => (
        <line key={x} x1={x} y1={y} x2={x - 8} y2={y + 8} strokeWidth={1} />
      ))}
    </g>
  );
}

function WaterBody({
  x,
  width,
  level,
  floor = 260,
}: {
  x: number;
  width: number;
  level: number;
  floor?: number;
}) {
  const wave = `M ${x} ${level} ${"q 6 -5 12 0 t 12 0 ".repeat(
    Math.floor(width / 24),
  )}`;
  return (
    <g className="text-primary">
      <rect
        x={x}
        y={level}
        width={width}
        height={floor - level}
        className="fill-primary/10"
      />
      <path d={wave} stroke="currentColor" strokeWidth={2} />
    </g>
  );
}

function DimLine({
  x,
  y1,
  y2,
  label,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
}) {
  return (
    <g className="text-muted-foreground" stroke="currentColor" strokeWidth={1}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 5} y1={y1} x2={x + 5} y2={y1} />
      <line x1={x - 5} y1={y2} x2={x + 5} y2={y2} />
      <text
        x={x + 10}
        y={(y1 + y2) / 2}
        className="fill-current font-mono"
        fontSize={11}
        stroke="none"
      >
        {label}
      </text>
    </g>
  );
}

function Annotation({
  x,
  y,
  children,
  anchor = "start",
}: {
  x: number;
  y: number;
  children: string;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      className="fill-muted-foreground"
      fontSize={11}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 7;
  const left = angle + Math.PI * 0.85;
  const right = angle - Math.PI * 0.85;
  return (
    <g className="text-primary" stroke="currentColor" strokeWidth={2}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <line
        x1={x2}
        y1={y2}
        x2={x2 + headLength * Math.cos(left)}
        y2={y2 + headLength * Math.sin(left)}
      />
      <line
        x1={x2}
        y1={y2}
        x2={x2 + headLength * Math.cos(right)}
        y2={y2 + headLength * Math.sin(right)}
      />
    </g>
  );
}

function BoxwallDiagram({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DiagramSvg ariaLabel={ariaLabel}>
      <WaterBody x={24} width={256} level={168} />
      <GroundLine />
      <path
        d="M 280 84 L 298 84 L 298 260 L 180 260 L 180 246 L 280 246 Z"
        className="fill-card text-foreground"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Arrow x1={224} y1={205} x2={268} y2={205} />
      <Arrow x1={210} y1={210} x2={210} y2={240} />
      <Arrow x1={244} y1={210} x2={244} y2={240} />
      <DimLine x={330} y1={84} y2={260} label="50–85 cm" />
      <Annotation x={30} y={156}>
        water side
      </Annotation>
      <Annotation x={196} y={232}>
        load seals the base
      </Annotation>
      <Annotation x={306} y={76}>
        interlocking ABS unit — freestanding L-profile
      </Annotation>
    </DiagramSvg>
  );
}

function GateDiagram({ ariaLabel }: { ariaLabel: string }) {
  const plankHeight = 38;
  const plankGap = 5;
  const plankBottoms = [222, 179, 136, 93];
  return (
    <DiagramSvg ariaLabel={ariaLabel}>
      <GroundLine />
      {[118, 348].map((x) => (
        <rect
          key={x}
          x={x}
          y={64}
          width={14}
          height={196}
          className="fill-muted text-foreground"
          stroke="currentColor"
          strokeWidth={2}
        />
      ))}
      {plankBottoms.map((y) => (
        <rect
          key={y}
          x={132}
          y={y}
          width={216}
          height={plankHeight}
          className="fill-card text-foreground"
          stroke="currentColor"
          strokeWidth={2}
        />
      ))}
      {plankBottoms.slice(0, 3).map((y) => (
        <line
          key={`seal-${y}`}
          x1={134}
          y1={y - plankGap + 2}
          x2={346}
          y2={y - plankGap + 2}
          className="text-primary"
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray="8 6"
        />
      ))}
      <DimLine x={382} y1={222} y2={222 + plankHeight} label="180 mm" />
      <Annotation x={132} y={54}>
        6063-T6 planks, stacked to height
      </Annotation>
      <Annotation x={356} y={130}>
        EPDM seal
      </Annotation>
      <Annotation x={62} y={170} anchor="middle">
        post
      </Annotation>
    </DiagramSvg>
  );
}

function BagDiagram({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DiagramSvg ariaLabel={ariaLabel}>
      <rect
        x={52}
        y={120}
        width={128}
        height={16}
        rx={8}
        className="fill-card text-foreground"
        stroke="currentColor"
        strokeWidth={2}
      />
      <Annotation x={116} y={110} anchor="middle">
        ships flat · 0.23 kg
      </Annotation>
      <Arrow x1={196} y1={128} x2={252} y2={128} />
      <Annotation x={224} y={112} anchor="middle">
        + water
      </Annotation>
      <rect
        x={268}
        y={94}
        width={148}
        height={64}
        rx={30}
        className="fill-primary/10 text-foreground"
        stroke="currentColor"
        strokeWidth={2}
      />
      <Annotation x={342} y={84} anchor="middle">
        20 kg in 3–4 min
      </Annotation>
      <GroundLine y={272} />
      {[
        [120, 250],
        [212, 250],
        [304, 250],
        [166, 228],
        [258, 228],
      ].map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={88}
          height={22}
          rx={11}
          className="fill-card text-foreground"
          stroke="currentColor"
          strokeWidth={2}
        />
      ))}
      <Annotation x={240} y={296} anchor="middle">
        stack like sandbags — two layers per doorway
      </Annotation>
    </DiagramSvg>
  );
}

function TubeDiagram({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DiagramSvg ariaLabel={ariaLabel}>
      <WaterBody x={24} width={180} level={186} floor={252} />
      <GroundLine y={252} />
      <line
        x1={128}
        y1={252}
        x2={392}
        y2={252}
        className="text-foreground"
        stroke="currentColor"
        strokeWidth={4}
      />
      <circle
        cx={280}
        cy={192}
        r={60}
        className="fill-card text-foreground"
        stroke="currentColor"
        strokeWidth={2}
      />
      {[146, 182].map((x) => (
        <path
          key={x}
          d={`M ${x} 252 l 6 -12 l 6 12 Z`}
          className="fill-primary text-primary"
          stroke="currentColor"
        />
      ))}
      <Arrow x1={168} y1={214} x2={212} y2={214} />
      <DimLine x={368} y1={132} y2={252} label="1 m" />
      <Annotation x={30} y={174}>
        water side
      </Annotation>
      <Annotation x={132} y={236}>
        skirt + pins
      </Annotation>
      <Annotation x={244} y={120}>
        0.9 mm PVC tube — air or water fill
      </Annotation>
    </DiagramSvg>
  );
}

function FrpDiagram({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DiagramSvg ariaLabel={ariaLabel}>
      <rect
        x={120}
        y={104}
        width={240}
        height={112}
        rx={8}
        className="fill-card text-foreground"
        stroke="currentColor"
        strokeWidth={2.5}
      />
      {[180, 240, 300].map((x) => (
        <line
          key={x}
          x1={x}
          y1={106}
          x2={x}
          y2={214}
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={2}
        />
      ))}
      {[132, 150, 168].map((x) => (
        <line
          key={`hatch-${x}`}
          x1={x}
          y1={198}
          x2={x + 14}
          y2={212}
          className="text-primary"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
      <DimLine x={392} y1={104} y2={216} label="180 mm class" />
      <Annotation x={120} y={92}>
        pultruded FRP plank — multi-cell cross-section
      </Annotation>
      <Annotation x={240} y={248} anchor="middle">
        corrosion-free · non-conductive · continuous glass fibre
      </Annotation>
    </DiagramSvg>
  );
}

const GLYPH_PATHS: Record<TucsenbergProductDiagramKind, ReactNode> = {
  boxwall: (
    <>
      <path d="M 24 8 L 29 8 L 29 30 L 10 30 L 10 26 L 24 26 Z" />
      <path d="M 4 18 q 3 -2.5 6 0 t 6 0" className="text-primary" />
    </>
  ),
  gate: (
    <>
      <rect x={6} y={6} width={4} height={24} />
      <rect x={30} y={6} width={4} height={24} />
      <line x1={10} y1={12} x2={30} y2={12} />
      <line x1={10} y1={19} x2={30} y2={19} />
      <line x1={10} y1={26} x2={30} y2={26} />
    </>
  ),
  bag: (
    <>
      <rect x={6} y={20} width={28} height={10} rx={5} />
      <rect x={12} y={8} width={16} height={5} rx={2.5} />
      <line x1={20} y1={13} x2={20} y2={18} className="text-primary" />
    </>
  ),
  tube: (
    <>
      <circle cx={22} cy={19} r={11} />
      <line x1={4} y1={30} x2={36} y2={30} />
      <path d="M 4 16 q 3 -2.5 6 0" className="text-primary" />
    </>
  ),
  frp: (
    <>
      <rect x={6} y={10} width={28} height={18} rx={2} />
      <line x1={16} y1={10} x2={16} y2={28} />
      <line x1={25} y1={10} x2={25} y2={28} />
    </>
  ),
};

/** Small line glyph for product-line tiles; decorative (aria-hidden). */
export function ProductLineGlyph({
  kind,
  className,
}: {
  kind: TucsenbergProductDiagramKind;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={className ?? "size-8 shrink-0"}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 40 36"
    >
      {GLYPH_PATHS[kind]}
    </svg>
  );
}

const DIAGRAMS: Record<
  TucsenbergProductDiagramKind,
  (props: { ariaLabel: string }) => ReactNode
> = {
  boxwall: BoxwallDiagram,
  gate: GateDiagram,
  bag: BagDiagram,
  tube: TubeDiagram,
  frp: FrpDiagram,
};

export function ProductDiagramPanel({
  diagram,
}: {
  diagram: TucsenbergProductDiagram;
}) {
  const Diagram = DIAGRAMS[diagram.kind];
  const staticDrawing = <Diagram ariaLabel={diagram.ariaLabel} />;
  return (
    <figure
      className="border-border bg-card min-w-0 rounded-2xl border p-4 md:p-5"
      data-testid="product-diagram"
    >
      {diagram.panelLabel ? (
        <div className="border-border mb-3 flex items-center justify-between gap-3 border-b pb-3">
          <span className="text-muted-foreground font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
            {diagram.panelLabel}
          </span>
          <span aria-hidden className="bg-primary size-1.5 rounded-full" />
        </div>
      ) : null}
      {diagram.animated && diagram.kind === "boxwall" ? (
        <BoxwallCrossSection fallback={staticDrawing} />
      ) : (
        staticDrawing
      )}
      <figcaption className="text-muted-foreground border-border mt-3 border-t pt-3 text-xs leading-5">
        {diagram.caption}
      </figcaption>
    </figure>
  );
}
