interface TucsenbergProductMeta {
  title: string;
  description: string;
  updatedAt: string;
}

export const TUCSENBERG_PRODUCT_META = {
  "abs-flood-barriers": {
    title: "ABS Interlocking Flood Barriers — Freestanding Boxwall",
    description:
      "Freestanding ABS interlocking flood barriers, factory-direct from China. 50–85 cm heights; straight, curve and gable-end units. Quoted within 12 hours.",
    updatedAt: "2026-07-05T00:00:00Z",
  },
  "aluminum-flood-gates": {
    title: "Aluminum Flood Gates for Doors & Garages — Custom-Cut",
    description:
      "Demountable aluminum flood gates (flood boards): 6063-T6 planks, EPDM seals, custom-cut to your openings — doors, garages, loading docks. 12-hour quotes.",
    updatedAt: "2026-07-05T00:00:00Z",
  },
  "absorbent-flood-bags": {
    title: "Sandless Sandbags & Water-Activated Flood Bags — Wholesale",
    description:
      "Water-activated absorbent flood bags factory-direct: 0.23 kg flat, 20 kg in 3–4 minutes, 3-year shelf life. Carton to pallet, private label. Fresh water only.",
    updatedAt: "2026-07-05T00:00:00Z",
  },
  "flood-tube-dams": {
    title: "Water & Air-Filled Tube Dams — Flood Barriers for Long Runs",
    description:
      "Inflatable PVC tube dams factory-direct: 1 m height, 5–10 m sections, deploy on grass and mud where rigid barriers can't seal. Kit included. 12-hour quotes.",
    updatedAt: "2026-07-06T00:00:00Z",
  },
  "frp-flood-barriers": {
    title: "FRP Composite Flood Barrier Planks — Corrosion-Free",
    description:
      "Pultruded FRP composite flood planks: corrosion-free, non-conductive, built for coastal and industrial sites. Order-driven production — register interest.",
    updatedAt: "2026-07-06T00:00:00Z",
  },
} as const satisfies Record<string, TucsenbergProductMeta>;
