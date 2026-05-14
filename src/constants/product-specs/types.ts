export interface SpecGroup {
  /** Group label, e.g. "Basic Option" */
  groupLabel: string;
  /** Column headers, e.g. ["Size", "Angle", "Wall", "End Type"] */
  columns: string[];
  /** Data rows — each row is an array of string values matching columns */
  rows: string[][];
}

export interface FamilySpecs {
  /** Must match a slug in product-catalog.ts families */
  slug: string;
  /** Product image paths (placeholder or real) */
  images: string[];
  /** Key selling points (raw English strings) */
  highlights: string[];
  /** Spec rows grouped by category (e.g. Schedule, Duty) */
  specGroups: SpecGroup[];
}

interface TradeInfo {
  moq: string;
  leadTime: string;
  supplyCapacity: string;
  packaging: string;
  portOfLoading: string;
}

export interface MarketSpecs {
  /** Market-level content freshness used by sitemap lastmod */
  updatedAt: string;
  /** Shared material/physical properties (key-value) */
  technical: Record<string, string>;
  /** Standard/certification names */
  certifications: string[];
  /** Trade terms */
  trade: TradeInfo;
  /** Per-family spec data */
  families: FamilySpecs[];
}
