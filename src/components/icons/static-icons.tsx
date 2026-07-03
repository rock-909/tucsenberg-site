import type { ComponentType, ReactNode, SVGProps } from "react";

export interface StaticIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

interface StaticIconBaseProps extends StaticIconProps {
  children: ReactNode;
}

export type StaticIconComponent = ComponentType<StaticIconProps>;

function StaticIconBase({
  children,
  fill = "none",
  size = 20,
  strokeWidth = 2,
  ...props
}: StaticIconBaseProps) {
  return (
    <svg
      aria-hidden="true"
      fill={fill}
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function StaticArrowUpRightIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </StaticIconBase>
  );
}

export function StaticAwardIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12.5-1.5 8 5-3 5 3-1.5-8" />
    </StaticIconBase>
  );
}

export function StaticBuildingIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
      <path d="M6 12H4a2 2 0 0 0-2 2v8" />
      <path d="M18 9h2a2 2 0 0 1 2 2v11" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </StaticIconBase>
  );
}

export function StaticCableIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M7 5h4" />
      <path d="M9 5v6" />
      <path d="M5 11h8" />
      <path d="M7 19h4" />
      <path d="M9 13v6" />
      <path d="M13 11h3a3 3 0 0 1 0 6h-3" />
    </StaticIconBase>
  );
}

export function StaticCheckIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M20 6 9 17l-5-5" />
    </StaticIconBase>
  );
}

export function StaticClockIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </StaticIconBase>
  );
}

export function StaticWorkspaceIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V9l5 3V9l5 3V5h4v16" />
      <path d="M9 17h1" />
      <path d="M14 17h1" />
    </StaticIconBase>
  );
}

export function StaticFileTextIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </StaticIconBase>
  );
}

export function StaticFolderOpenIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2" />
      <path d="M3 11h18l-2 8a2 2 0 0 1-2 1.5H5a2 2 0 0 1-2-1.5z" />
    </StaticIconBase>
  );
}

export function StaticLayoutGridIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <rect height="7" rx="1.5" width="7" x="3" y="3" />
      <rect height="7" rx="1.5" width="7" x="14" y="3" />
      <rect height="7" rx="1.5" width="7" x="3" y="14" />
      <rect height="7" rx="1.5" width="7" x="14" y="14" />
    </StaticIconBase>
  );
}

export function StaticPackageIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12 4 7.5" />
      <path d="m12 12 8-4.5" />
      <path d="M12 12v9" />
    </StaticIconBase>
  );
}

export function StaticPencilRulerIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="m14 4 6 6-9 9H5v-6z" />
      <path d="m14 4 2-2 6 6-2 2" />
      <path d="M4 20h16" />
      <path d="M8 14h3" />
    </StaticIconBase>
  );
}

export function StaticShieldCheckIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </StaticIconBase>
  );
}

export function StaticUserIcon(props: StaticIconProps) {
  return (
    <StaticIconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0" />
    </StaticIconBase>
  );
}
