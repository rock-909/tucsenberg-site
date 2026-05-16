# Step 3: Product Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a structured product + OEM compatibility database in `src/data/` that lets pages query "which Tucsenberg product fits this OEM model?" and "which OEM models does this product replace?" — with three-language support, Zod validation, and build-time QA.

**Architecture:** Four-layer static data model (ProductGroup → ProductVariant → OEMBrand/OEMModel → CompatibilityMapping) defined with Zod schemas, populated with real OEM teardown data for Phase 1 brands (Sanitaire, EDI, SSI). Query functions provide search-by-part-number, lookup-by-brand, and lookup-by-product. All data is static TypeScript — no database, no runtime API. Three-language i18n (en/es/zh) inline in data objects.

**Tech Stack:** TypeScript 6.0.3 strict, Zod validation, Vitest, static TS data files, build-time QA tests.

**Data Source:** `/Users/Data/workspace/aeration-brand/catalog/oem-product-teardown.md` — reference only, do not copy the file into this repo.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/data/schemas.ts` | Zod schemas for all 5 data types + inferred TS types |
| `src/data/i18n-types.ts` | Shared i18n helper type `I18nText = { en: string; es: string; zh: string }` |
| `src/data/oem-brands.ts` | OEM brand definitions (Sanitaire, EDI, SSI) with trademark disclaimers |
| `src/data/oem-models.ts` | OEM model definitions with real part numbers, dimensions, specs |
| `src/data/products.ts` | Tucsenberg ProductGroup and ProductVariant definitions |
| `src/data/compatibility.ts` | CompatibilityMapping entries linking OEM models → Tucsenberg products |
| `src/data/queries.ts` | Query/search functions for pages to consume |
| `src/data/index.ts` | Public API barrel export |
| `src/data/__tests__/schemas.test.ts` | Schema validation tests |
| `src/data/__tests__/data-integrity.test.ts` | Cross-referential integrity + i18n completeness tests |
| `src/data/__tests__/queries.test.ts` | Query function behavior tests |

---

## Task 1: I18n helper type and Zod schemas

**Files:**
- Create: `src/data/i18n-types.ts`
- Create: `src/data/schemas.ts`
- Create: `src/data/__tests__/schemas.test.ts`

- [ ] **Step 1: Create the i18n helper type**

```typescript
// src/data/i18n-types.ts
import { z } from "zod";

export const i18nTextSchema = z.object({
  en: z.string().min(1),
  es: z.string().min(1),
  zh: z.string().min(1),
});

export type I18nText = z.infer<typeof i18nTextSchema>;
```

- [ ] **Step 2: Write failing schema tests**

```typescript
// src/data/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import {
  productGroupSchema,
  productVariantSchema,
  oemBrandSchema,
  oemModelSchema,
  compatibilityMappingSchema,
} from "@/data/schemas";

describe("product data schemas", () => {
  it("validates a correct ProductGroup", () => {
    const result = productGroupSchema.safeParse({
      id: "9-inch-disc",
      slug: "9-inch-disc",
      name: { en: "9-inch Disc Membrane", es: "Membrana de disco de 9 pulgadas", zh: "9英寸盘式膜片" },
      description: {
        en: "Replacement disc membranes for 9-inch diffuser bodies",
        es: "Membranas de disco de reemplazo para cuerpos difusores de 9 pulgadas",
        zh: "适用于9英寸扩散器体的替换盘式膜片",
      },
      category: "disc",
      variantIds: ["9-inch-disc-epdm", "9-inch-disc-tpu"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects ProductGroup with empty name locale", () => {
    const result = productGroupSchema.safeParse({
      id: "bad",
      slug: "bad",
      name: { en: "Good", es: "", zh: "好" },
      description: { en: "d", es: "d", zh: "d" },
      category: "disc",
      variantIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("validates a correct ProductVariant", () => {
    const result = productVariantSchema.safeParse({
      id: "9-inch-disc-epdm",
      slug: "9-inch-epdm-disc-replacement",
      groupId: "9-inch-disc",
      name: {
        en: "9-inch EPDM Disc Replacement Membrane",
        es: "Membrana de reemplazo de disco EPDM de 9 pulgadas",
        zh: "9英寸EPDM盘式替换膜片",
      },
      material: "epdm",
      sku: "TUC-D9-EPDM",
      phase: 1,
      specs: {
        diameter: { value: 9, unit: "inch" },
        temperatureRange: { min: -40, max: 115, unit: "celsius" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects ProductVariant with invalid material", () => {
    const result = productVariantSchema.safeParse({
      id: "bad",
      slug: "bad",
      groupId: "g",
      name: { en: "n", es: "n", zh: "n" },
      material: "rubber",
      sku: "TUC-X",
      phase: 1,
      specs: {},
    });
    expect(result.success).toBe(false);
  });

  it("validates a correct OEMBrand", () => {
    const result = oemBrandSchema.safeParse({
      id: "sanitaire",
      slug: "sanitaire",
      name: "Sanitaire",
      parentCompany: "Xylem",
      trademarkDisclaimer: {
        en: "Sanitaire is a registered trademark of Xylem Inc. Tucsenberg is not affiliated with or endorsed by Xylem Inc.",
        es: "Sanitaire es una marca registrada de Xylem Inc. Tucsenberg no está afiliado ni respaldado por Xylem Inc.",
        zh: "Sanitaire 是 Xylem Inc. 的注册商标。Tucsenberg 与 Xylem Inc. 没有关联，也未获得其认可。",
      },
      modelIds: ["sanitaire-silver-ii-9"],
    });
    expect(result.success).toBe(true);
  });

  it("validates a correct OEMModel", () => {
    const result = oemModelSchema.safeParse({
      id: "sanitaire-silver-ii-9",
      slug: "sanitaire-silver-series-ii-9-inch",
      brandId: "sanitaire",
      name: "Silver Series II 9-inch",
      oemPartNumbers: ["EDI 00223"],
      category: "disc",
      specs: {
        diameter: { value: 9, unit: "inch" },
        connectionStyle: "3/4\" NPT threaded",
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates a correct CompatibilityMapping", () => {
    const result = compatibilityMappingSchema.safeParse({
      id: "sanitaire-silver-ii-9--tuc-d9-epdm",
      oemModelId: "sanitaire-silver-ii-9",
      productVariantId: "9-inch-disc-epdm",
      fitStatus: "exact",
      confidence: "high",
      requiredChecks: [],
      disclaimer: "Verify diffuser body condition before installation.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects CompatibilityMapping with invalid fitStatus", () => {
    const result = compatibilityMappingSchema.safeParse({
      id: "bad",
      oemModelId: "x",
      productVariantId: "y",
      fitStatus: "maybe",
      confidence: "high",
      requiredChecks: [],
      disclaimer: "d",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec vitest run src/data/__tests__/schemas.test.ts`
Expected: FAIL — module `@/data/schemas` not found.

- [ ] **Step 4: Implement the Zod schemas**

```typescript
// src/data/schemas.ts
import { z } from "zod";
import { i18nTextSchema } from "./i18n-types";

const dimensionSchema = z.object({
  value: z.number(),
  unit: z.enum(["inch", "mm"]),
});

const temperatureRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.enum(["celsius", "fahrenheit"]),
});

const airFlowRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.enum(["scfm", "sm3/hr/m"]),
});

const productSpecsSchema = z.object({
  diameter: dimensionSchema.optional(),
  length: dimensionSchema.optional(),
  wallThickness: dimensionSchema.optional(),
  temperatureRange: temperatureRangeSchema.optional(),
  shoreHardness: z.number().optional(),
  tensileStrength: z.number().optional(),
  airFlowRange: airFlowRangeSchema.optional(),
});

const oemSpecsSchema = z.object({
  diameter: dimensionSchema.optional(),
  length: dimensionSchema.optional(),
  connectionStyle: z.string().optional(),
  airFlowRange: airFlowRangeSchema.optional(),
});

export const productGroupSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: i18nTextSchema,
  description: i18nTextSchema,
  category: z.enum(["disc", "tube"]),
  variantIds: z.array(z.string()),
});

export const productVariantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  groupId: z.string().min(1),
  name: i18nTextSchema,
  material: z.enum(["epdm", "tpu"]),
  sku: z.string().min(1),
  phase: z.union([z.literal(1), z.literal(2)]),
  specs: productSpecsSchema,
});

export const oemBrandSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  parentCompany: z.string().optional(),
  trademarkDisclaimer: i18nTextSchema,
  modelIds: z.array(z.string()),
});

export const oemModelSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  oemPartNumbers: z.array(z.string()),
  category: z.enum(["disc", "tube"]),
  specs: oemSpecsSchema,
});

export const compatibilityMappingSchema = z.object({
  id: z.string().min(1),
  oemModelId: z.string().min(1),
  productVariantId: z.string().min(1),
  fitStatus: z.enum(["exact", "verify-dimensions", "custom"]),
  confidence: z.enum(["high", "medium", "low"]),
  requiredChecks: z.array(z.string()),
  disclaimer: z.string(),
});

export type ProductGroup = z.infer<typeof productGroupSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type OEMBrand = z.infer<typeof oemBrandSchema>;
export type OEMModel = z.infer<typeof oemModelSchema>;
export type CompatibilityMapping = z.infer<typeof compatibilityMappingSchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run src/data/__tests__/schemas.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/data/i18n-types.ts src/data/schemas.ts src/data/__tests__/schemas.test.ts
git commit -m "feat(data): add Zod schemas for product data layer

Define ProductGroup, ProductVariant, OEMBrand, OEMModel, and
CompatibilityMapping schemas with I18nText support. All schema
tests passing."
```

---

## Task 2: OEM brands and models data

**Files:**
- Create: `src/data/oem-brands.ts`
- Create: `src/data/oem-models.ts`

Data extracted from `/Users/Data/workspace/aeration-brand/catalog/oem-product-teardown.md`. Do not copy that file — only reference it for field values.

- [ ] **Step 1: Create OEM brands data**

```typescript
// src/data/oem-brands.ts
import type { OEMBrand } from "./schemas";

export const oemBrands: OEMBrand[] = [
  {
    id: "sanitaire",
    slug: "sanitaire",
    name: "Sanitaire",
    parentCompany: "Xylem",
    trademarkDisclaimer: {
      en: "Sanitaire is a registered trademark of Xylem Inc. Tucsenberg is not affiliated with or endorsed by Xylem Inc.",
      es: "Sanitaire es una marca registrada de Xylem Inc. Tucsenberg no está afiliado ni respaldado por Xylem Inc.",
      zh: "Sanitaire 是 Xylem Inc. 的注册商标。Tucsenberg 与 Xylem Inc. 没有关联，也未获得其认可。",
    },
    modelIds: [
      "sanitaire-silver-ii-9",
      "sanitaire-silver-ii-7",
      "sanitaire-mt2-tube",
    ],
  },
  {
    id: "edi",
    slug: "edi",
    name: "EDI",
    parentCompany: "Environmental Dynamics International",
    trademarkDisclaimer: {
      en: "EDI and FlexAir are registered trademarks of Environmental Dynamics International. Tucsenberg is not affiliated with or endorsed by EDI.",
      es: "EDI y FlexAir son marcas registradas de Environmental Dynamics International. Tucsenberg no está afiliado ni respaldado por EDI.",
      zh: "EDI 和 FlexAir 是 Environmental Dynamics International 的注册商标。Tucsenberg 与 EDI 没有关联，也未获得其认可。",
    },
    modelIds: [
      "edi-threaded-disc-9",
      "edi-threaded-disc-12",
      "edi-threaded-disc-7",
      "edi-flexair-tube-62x610",
      "edi-flexair-tube-62x762",
      "edi-flexair-tube-62x1003",
      "edi-flexair-tube-91x502",
      "edi-flexair-tube-91x762",
      "edi-flexair-tube-91x1003",
    ],
  },
  {
    id: "ssi",
    slug: "ssi",
    name: "SSI Aeration",
    trademarkDisclaimer: {
      en: "SSI Aeration is a registered trademark of SSI Aeration, Inc. Tucsenberg is not affiliated with or endorsed by SSI Aeration, Inc.",
      es: "SSI Aeration es una marca registrada de SSI Aeration, Inc. Tucsenberg no está afiliado ni respaldado por SSI Aeration, Inc.",
      zh: "SSI Aeration 是 SSI Aeration, Inc. 的注册商标。Tucsenberg 与 SSI Aeration, Inc. 没有关联，也未获得其认可。",
    },
    modelIds: [
      "ssi-afd270-9",
      "ssi-afd350-12",
    ],
  },
];
```

- [ ] **Step 2: Create OEM models data**

```typescript
// src/data/oem-models.ts
import type { OEMModel } from "./schemas";

export const oemModels: OEMModel[] = [
  // ── Sanitaire ──
  {
    id: "sanitaire-silver-ii-9",
    slug: "sanitaire-silver-series-ii-9-inch",
    brandId: "sanitaire",
    name: "Silver Series II 9-inch",
    oemPartNumbers: ["EDI 00223"],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: "3/4\" NPT threaded",
      airFlowRange: { min: 0.8, max: 6.8, unit: "sm3/hr/m" },
    },
  },
  {
    id: "sanitaire-silver-ii-7",
    slug: "sanitaire-silver-series-ii-7-inch",
    brandId: "sanitaire",
    name: "Silver Series II 7-inch",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 7, unit: "inch" },
      connectionStyle: "3/4\" NPT threaded",
    },
  },
  {
    id: "sanitaire-mt2-tube",
    slug: "sanitaire-mt2-tube-62x610",
    brandId: "sanitaire",
    name: "MT-2 Tube 62×610mm",
    oemPartNumbers: ["EDI 00326", "EDI 00325"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 610, unit: "mm" },
      connectionStyle: "3/4\" 304 SS nipple",
    },
  },

  // ── EDI Discs ──
  {
    id: "edi-threaded-disc-9",
    slug: "edi-threaded-disc-9-inch",
    brandId: "edi",
    name: "Threaded Disc 9-inch",
    oemPartNumbers: ["01798", "01799"],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: "3/4\" NPT threaded",
      airFlowRange: { min: 6, max: 10, unit: "scfm" },
    },
  },
  {
    id: "edi-threaded-disc-12",
    slug: "edi-threaded-disc-12-inch",
    brandId: "edi",
    name: "Threaded Disc 12-inch",
    oemPartNumbers: ["06078", "06080"],
    category: "disc",
    specs: {
      diameter: { value: 12, unit: "inch" },
      connectionStyle: "3/4\" NPT threaded",
      airFlowRange: { min: 9.4, max: 16, unit: "scfm" },
    },
  },
  {
    id: "edi-threaded-disc-7",
    slug: "edi-threaded-disc-7-inch",
    brandId: "edi",
    name: "Threaded Disc 7-inch",
    oemPartNumbers: ["01691", "02001"],
    category: "disc",
    specs: {
      diameter: { value: 7, unit: "inch" },
      connectionStyle: "3/4\" NPT threaded",
      airFlowRange: { min: 3, max: 7.5, unit: "scfm" },
    },
  },

  // ── EDI Tubes (62mm) ──
  {
    id: "edi-flexair-tube-62x610",
    slug: "edi-flexair-tube-62x610",
    brandId: "edi",
    name: "FlexAir Tube 62×610mm",
    oemPartNumbers: ["00249", "00250"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 610, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 2, max: 8, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-62x762",
    slug: "edi-flexair-tube-62x762",
    brandId: "edi",
    name: "FlexAir Tube 62×762mm",
    oemPartNumbers: ["01202", "01026"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 762, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 3, max: 10, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-62x1003",
    slug: "edi-flexair-tube-62x1003",
    brandId: "edi",
    name: "FlexAir Tube 62×1003mm",
    oemPartNumbers: ["01029", "01030"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 1003, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 3, max: 14, unit: "scfm" },
    },
  },

  // ── EDI Tubes (91mm) ──
  {
    id: "edi-flexair-tube-91x502",
    slug: "edi-flexair-tube-91x502",
    brandId: "edi",
    name: "FlexAir Tube 91×502mm",
    oemPartNumbers: ["00256", "00253"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 502, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 4, max: 13, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-91x762",
    slug: "edi-flexair-tube-91x762",
    brandId: "edi",
    name: "FlexAir Tube 91×762mm",
    oemPartNumbers: ["00259", "00262"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 762, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 7, max: 20, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-91x1003",
    slug: "edi-flexair-tube-91x1003",
    brandId: "edi",
    name: "FlexAir Tube 91×1003mm",
    oemPartNumbers: ["00268", "00265"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 1003, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 9, max: 27, unit: "scfm" },
    },
  },

  // ── SSI ──
  {
    id: "ssi-afd270-9",
    slug: "ssi-afd270-9-inch",
    brandId: "ssi",
    name: "AFD270 9-inch Disc",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: "3/4\" NPT",
    },
  },
  {
    id: "ssi-afd350-12",
    slug: "ssi-afd350-12-inch",
    brandId: "ssi",
    name: "AFD350 12-inch Disc",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 12, unit: "inch" },
      connectionStyle: "3/4\" NPT",
    },
  },
];
```

- [ ] **Step 3: Validate data against schemas (quick sanity check)**

Run: `pnpm exec tsx -e "import { oemBrandSchema } from './src/data/schemas'; import { oemBrands } from './src/data/oem-brands'; oemBrands.forEach(b => oemBrandSchema.parse(b)); console.log('OK:', oemBrands.length, 'brands')"`

Expected: `OK: 3 brands`

Run: `pnpm exec tsx -e "import { oemModelSchema } from './src/data/schemas'; import { oemModels } from './src/data/oem-models'; oemModels.forEach(m => oemModelSchema.parse(m)); console.log('OK:', oemModels.length, 'models')"`

Expected: `OK: 14 models`

- [ ] **Step 4: Commit**

```bash
git add src/data/oem-brands.ts src/data/oem-models.ts
git commit -m "feat(data): add OEM brand and model data for Sanitaire, EDI, SSI

3 brands, 14 models with real part numbers from OEM teardown.
Covers Phase 1 disc (7/9/12-inch) and tube (62mm/91mm) models."
```

---

## Task 3: Tucsenberg product data

**Files:**
- Create: `src/data/products.ts`

- [ ] **Step 1: Create product groups and variants**

```typescript
// src/data/products.ts
import type { ProductGroup, ProductVariant } from "./schemas";

export const productGroups: ProductGroup[] = [
  {
    id: "9-inch-disc",
    slug: "9-inch-disc",
    name: {
      en: "9-inch Disc Membrane",
      es: "Membrana de disco de 9 pulgadas",
      zh: "9英寸盘式膜片",
    },
    description: {
      en: "Replacement disc membranes for 9-inch aeration diffuser bodies",
      es: "Membranas de disco de reemplazo para cuerpos difusores de aireación de 9 pulgadas",
      zh: "适用于9英寸曝气扩散器体的替换盘式膜片",
    },
    category: "disc",
    variantIds: ["9-inch-disc-epdm", "9-inch-disc-tpu"],
  },
  {
    id: "12-inch-disc",
    slug: "12-inch-disc",
    name: {
      en: "12-inch Disc Membrane",
      es: "Membrana de disco de 12 pulgadas",
      zh: "12英寸盘式膜片",
    },
    description: {
      en: "Replacement disc membranes for 12-inch aeration diffuser bodies",
      es: "Membranas de disco de reemplazo para cuerpos difusores de aireación de 12 pulgadas",
      zh: "适用于12英寸曝气扩散器体的替换盘式膜片",
    },
    category: "disc",
    variantIds: ["12-inch-disc-epdm"],
  },
  {
    id: "7-inch-disc",
    slug: "7-inch-disc",
    name: {
      en: "7-inch Disc Membrane",
      es: "Membrana de disco de 7 pulgadas",
      zh: "7英寸盘式膜片",
    },
    description: {
      en: "Replacement disc membranes for 7-inch aeration diffuser bodies",
      es: "Membranas de disco de reemplazo para cuerpos difusores de aireación de 7 pulgadas",
      zh: "适用于7英寸曝气扩散器体的替换盘式膜片",
    },
    category: "disc",
    variantIds: ["7-inch-disc-epdm"],
  },
  {
    id: "tube-62mm",
    slug: "tube-62mm",
    name: {
      en: "62mm Tube Membrane",
      es: "Membrana tubular de 62 mm",
      zh: "62mm管式膜片",
    },
    description: {
      en: "Replacement tube membranes for 62mm diameter aeration diffusers",
      es: "Membranas tubulares de reemplazo para difusores de aireación de 62 mm de diámetro",
      zh: "适用于62mm直径曝气扩散器的替换管式膜片",
    },
    category: "tube",
    variantIds: ["tube-62mm-epdm", "tube-62mm-tpu"],
  },
  {
    id: "tube-91mm",
    slug: "tube-91mm",
    name: {
      en: "91mm Tube Membrane",
      es: "Membrana tubular de 91 mm",
      zh: "91mm管式膜片",
    },
    description: {
      en: "Replacement tube membranes for 91mm diameter aeration diffusers",
      es: "Membranas tubulares de reemplazo para difusores de aireación de 91 mm de diámetro",
      zh: "适用于91mm直径曝气扩散器的替换管式膜片",
    },
    category: "tube",
    variantIds: ["tube-91mm-epdm"],
  },
];

export const productVariants: ProductVariant[] = [
  // ── 9-inch disc ──
  {
    id: "9-inch-disc-epdm",
    slug: "9-inch-epdm-disc-replacement",
    groupId: "9-inch-disc",
    name: {
      en: "9-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 9 pulgadas",
      zh: "9英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D9-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 9, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
      shoreHardness: 55, // pending supplier confirmation
      tensileStrength: 1300, // pending supplier confirmation
    },
  },
  {
    id: "9-inch-disc-tpu",
    slug: "9-inch-tpu-disc-replacement",
    groupId: "9-inch-disc",
    name: {
      en: "9-inch TPU Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco TPU de 9 pulgadas",
      zh: "9英寸TPU盘式替换膜片",
    },
    material: "tpu",
    sku: "TUC-D9-TPU",
    phase: 1,
    specs: {
      diameter: { value: 9, unit: "inch" },
      temperatureRange: { min: -20, max: 70, unit: "celsius" },
      shoreHardness: 85, // pending supplier confirmation
      tensileStrength: 3500, // pending supplier confirmation
    },
  },

  // ── 12-inch disc ──
  {
    id: "12-inch-disc-epdm",
    slug: "12-inch-epdm-disc-replacement",
    groupId: "12-inch-disc",
    name: {
      en: "12-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 12 pulgadas",
      zh: "12英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D12-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 12, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },

  // ── 7-inch disc ──
  {
    id: "7-inch-disc-epdm",
    slug: "7-inch-epdm-disc-replacement",
    groupId: "7-inch-disc",
    name: {
      en: "7-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 7 pulgadas",
      zh: "7英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D7-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 7, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },

  // ── 62mm tube ──
  {
    id: "tube-62mm-epdm",
    slug: "62mm-epdm-tube-replacement",
    groupId: "tube-62mm",
    name: {
      en: "62mm EPDM Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo EPDM de 62 mm",
      zh: "62mm EPDM管式替换膜片",
    },
    material: "epdm",
    sku: "TUC-T62-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 62, unit: "mm" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },
  {
    id: "tube-62mm-tpu",
    slug: "62mm-tpu-tube-replacement",
    groupId: "tube-62mm",
    name: {
      en: "62mm TPU Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo TPU de 62 mm",
      zh: "62mm TPU管式替换膜片",
    },
    material: "tpu",
    sku: "TUC-T62-TPU",
    phase: 1,
    specs: {
      diameter: { value: 62, unit: "mm" },
      temperatureRange: { min: -20, max: 70, unit: "celsius" },
    },
  },

  // ── 91mm tube ──
  {
    id: "tube-91mm-epdm",
    slug: "91mm-epdm-tube-replacement",
    groupId: "tube-91mm",
    name: {
      en: "91mm EPDM Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo EPDM de 91 mm",
      zh: "91mm EPDM管式替换膜片",
    },
    material: "epdm",
    sku: "TUC-T91-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 91, unit: "mm" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },
];
```

- [ ] **Step 2: Validate products against schemas**

Run: `pnpm exec tsx -e "import { productGroupSchema, productVariantSchema } from './src/data/schemas'; import { productGroups, productVariants } from './src/data/products'; productGroups.forEach(g => productGroupSchema.parse(g)); productVariants.forEach(v => productVariantSchema.parse(v)); console.log('OK:', productGroups.length, 'groups,', productVariants.length, 'variants')"`

Expected: `OK: 5 groups, 7 variants`

- [ ] **Step 3: Commit**

```bash
git add src/data/products.ts
git commit -m "feat(data): add Tucsenberg product groups and variants

5 product groups (9/12/7-inch disc + 62mm/91mm tube),
7 variants (EPDM + TPU where applicable). SKU format: TUC-[type][size]-[material].
Three-language i18n (en/es/zh) for all name and description fields."
```

---

## Task 4: Compatibility mappings

**Files:**
- Create: `src/data/compatibility.ts`

- [ ] **Step 1: Create compatibility mapping data**

```typescript
// src/data/compatibility.ts
import type { CompatibilityMapping } from "./schemas";

export const compatibilityMappings: CompatibilityMapping[] = [
  // ── 9-inch disc EPDM: the universal replacement ──
  {
    id: "sanitaire-silver-ii-9--tuc-d9-epdm",
    oemModelId: "sanitaire-silver-ii-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer: "Verify diffuser body condition and retainer ring compatibility before installation.",
  },
  {
    id: "edi-threaded-disc-9--tuc-d9-epdm",
    oemModelId: "edi-threaded-disc-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer: "Compatible with both Micro and High Capacity configurations.",
  },
  {
    id: "ssi-afd270-9--tuc-d9-epdm",
    oemModelId: "ssi-afd270-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer: "Standard 9-inch industry dimension. Verify thread connection before ordering.",
  },

  // ── 9-inch disc TPU ──
  {
    id: "sanitaire-silver-ii-9--tuc-d9-tpu",
    oemModelId: "sanitaire-silver-ii-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: ["Confirm wastewater conditions warrant TPU material selection"],
    disclaimer: "TPU recommended for oil, chemical, or high-grease wastewater only.",
  },
  {
    id: "edi-threaded-disc-9--tuc-d9-tpu",
    oemModelId: "edi-threaded-disc-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: ["Confirm wastewater conditions warrant TPU material selection"],
    disclaimer: "TPU recommended for oil, chemical, or high-grease wastewater only.",
  },
  {
    id: "ssi-afd270-9--tuc-d9-tpu",
    oemModelId: "ssi-afd270-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: ["Confirm wastewater conditions warrant TPU material selection"],
    disclaimer: "TPU recommended for oil, chemical, or high-grease wastewater only.",
  },

  // ── 12-inch disc EPDM ──
  {
    id: "edi-threaded-disc-12--tuc-d12-epdm",
    oemModelId: "edi-threaded-disc-12",
    productVariantId: "12-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer: "Compatible with both Micro and High Capacity configurations.",
  },
  {
    id: "ssi-afd350-12--tuc-d12-epdm",
    oemModelId: "ssi-afd350-12",
    productVariantId: "12-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: ["Confirm 12-inch body thread specification matches"],
    disclaimer: "Verify thread specification before ordering.",
  },

  // ── 7-inch disc EPDM ──
  {
    id: "sanitaire-silver-ii-7--tuc-d7-epdm",
    oemModelId: "sanitaire-silver-ii-7",
    productVariantId: "7-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "medium",
    requiredChecks: ["Confirm diffuser body is 7-inch variant, not 9-inch"],
    disclaimer: "Sanitaire Silver Series II is available in both 7-inch and 9-inch. Confirm installed size.",
  },
  {
    id: "edi-threaded-disc-7--tuc-d7-epdm",
    oemModelId: "edi-threaded-disc-7",
    productVariantId: "7-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer: "Compatible with both Micro and High Capacity configurations.",
  },

  // ── 62mm tube EPDM ──
  {
    id: "sanitaire-mt2-tube--tuc-t62-epdm",
    oemModelId: "sanitaire-mt2-tube",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm membrane length is 610mm", "Confirm SS clamp fixing"],
    disclaimer: "MT-2 uses stainless steel clamp fixing. Verify clamp compatibility.",
  },
  {
    id: "edi-flexair-tube-62x610--tuc-t62-epdm",
    oemModelId: "edi-flexair-tube-62x610",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (610mm)"],
    disclaimer: "FlexAir tubes are available in multiple lengths. Confirm installed length.",
  },
  {
    id: "edi-flexair-tube-62x762--tuc-t62-epdm",
    oemModelId: "edi-flexair-tube-62x762",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (762mm)"],
    disclaimer: "FlexAir tubes are available in multiple lengths. Confirm installed length.",
  },
  {
    id: "edi-flexair-tube-62x1003--tuc-t62-epdm",
    oemModelId: "edi-flexair-tube-62x1003",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (1003mm)"],
    disclaimer: "FlexAir tubes are available in multiple lengths. Confirm installed length.",
  },

  // ── 62mm tube TPU ──
  {
    id: "sanitaire-mt2-tube--tuc-t62-tpu",
    oemModelId: "sanitaire-mt2-tube",
    productVariantId: "tube-62mm-tpu",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      "Confirm membrane length is 610mm",
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer: "TPU recommended for oil, chemical, or high-grease wastewater only. Verify clamp compatibility.",
  },
  {
    id: "edi-flexair-tube-62x610--tuc-t62-tpu",
    oemModelId: "edi-flexair-tube-62x610",
    productVariantId: "tube-62mm-tpu",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      "Confirm required tube length (610mm)",
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer: "TPU recommended for oil, chemical, or high-grease wastewater only.",
  },

  // ── 91mm tube EPDM ──
  {
    id: "edi-flexair-tube-91x502--tuc-t91-epdm",
    oemModelId: "edi-flexair-tube-91x502",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (502mm)"],
    disclaimer: "FlexAir 91mm tubes are available in multiple lengths. Confirm installed length.",
  },
  {
    id: "edi-flexair-tube-91x762--tuc-t91-epdm",
    oemModelId: "edi-flexair-tube-91x762",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (762mm)"],
    disclaimer: "FlexAir 91mm tubes are available in multiple lengths. Confirm installed length.",
  },
  {
    id: "edi-flexair-tube-91x1003--tuc-t91-epdm",
    oemModelId: "edi-flexair-tube-91x1003",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (1003mm)"],
    disclaimer: "FlexAir 91mm tubes are available in multiple lengths. Confirm installed length.",
  },
];
```

- [ ] **Step 2: Validate mappings against schema**

Run: `pnpm exec tsx -e "import { compatibilityMappingSchema } from './src/data/schemas'; import { compatibilityMappings } from './src/data/compatibility'; compatibilityMappings.forEach(m => compatibilityMappingSchema.parse(m)); console.log('OK:', compatibilityMappings.length, 'mappings')"`

Expected: `OK: 20 mappings`

- [ ] **Step 3: Commit**

```bash
git add src/data/compatibility.ts
git commit -m "feat(data): add 20 OEM-to-Tucsenberg compatibility mappings

Covers all Phase 1 disc and tube products across Sanitaire, EDI, SSI.
Each mapping has fitStatus, confidence, requiredChecks, and disclaimer."
```

---

## Task 5: Query functions

**Files:**
- Create: `src/data/queries.ts`
- Create: `src/data/index.ts`
- Create: `src/data/__tests__/queries.test.ts`

- [ ] **Step 1: Write failing query tests**

```typescript
// src/data/__tests__/queries.test.ts
import { describe, it, expect } from "vitest";
import {
  getCompatibleProducts,
  getCompatibleOEMModels,
  getOEMBrandModels,
  getOEMBrandById,
  getOEMModelById,
  getProductVariantById,
  getProductGroupById,
  searchByPartNumber,
} from "@/data/queries";

describe("product data queries", () => {
  describe("getCompatibleProducts", () => {
    it("returns EPDM and TPU variants for Sanitaire Silver II 9-inch", () => {
      const results = getCompatibleProducts("sanitaire-silver-ii-9");
      expect(results.length).toBeGreaterThanOrEqual(2);
      const skus = results.map((r) => r.variant.sku);
      expect(skus).toContain("TUC-D9-EPDM");
      expect(skus).toContain("TUC-D9-TPU");
    });

    it("returns empty array for nonexistent model", () => {
      expect(getCompatibleProducts("nonexistent")).toEqual([]);
    });
  });

  describe("getCompatibleOEMModels", () => {
    it("returns Sanitaire, EDI, SSI models for 9-inch EPDM disc", () => {
      const results = getCompatibleOEMModels("9-inch-disc-epdm");
      expect(results.length).toBeGreaterThanOrEqual(3);
      const brandIds = results.map((r) => r.model.brandId);
      expect(brandIds).toContain("sanitaire");
      expect(brandIds).toContain("edi");
      expect(brandIds).toContain("ssi");
    });
  });

  describe("getOEMBrandModels", () => {
    it("returns all EDI models", () => {
      const models = getOEMBrandModels("edi");
      expect(models.length).toBeGreaterThanOrEqual(9);
    });

    it("returns empty for nonexistent brand", () => {
      expect(getOEMBrandModels("nonexistent")).toEqual([]);
    });
  });

  describe("searchByPartNumber", () => {
    it("finds EDI 00223 and returns 9-inch disc compatibility", () => {
      const results = searchByPartNumber("00223");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].model.oemPartNumbers).toContain("EDI 00223");
    });

    it("finds partial match on part number", () => {
      const results = searchByPartNumber("0022");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("returns empty for no match", () => {
      expect(searchByPartNumber("ZZZZZ")).toEqual([]);
    });

    it("is case-insensitive", () => {
      const results = searchByPartNumber("edi 00223");
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("lookup helpers", () => {
    it("getOEMBrandById returns Sanitaire", () => {
      const brand = getOEMBrandById("sanitaire");
      expect(brand?.name).toBe("Sanitaire");
    });

    it("getOEMModelById returns Silver Series II", () => {
      const model = getOEMModelById("sanitaire-silver-ii-9");
      expect(model?.name).toBe("Silver Series II 9-inch");
    });

    it("getProductVariantById returns TUC-D9-EPDM", () => {
      const variant = getProductVariantById("9-inch-disc-epdm");
      expect(variant?.sku).toBe("TUC-D9-EPDM");
    });

    it("getProductGroupById returns 9-inch disc group", () => {
      const group = getProductGroupById("9-inch-disc");
      expect(group?.category).toBe("disc");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run src/data/__tests__/queries.test.ts`
Expected: FAIL — module `@/data/queries` not found.

- [ ] **Step 3: Implement query functions**

```typescript
// src/data/queries.ts
import type { OEMBrand, OEMModel, ProductGroup, ProductVariant, CompatibilityMapping } from "./schemas";
import { oemBrands } from "./oem-brands";
import { oemModels } from "./oem-models";
import { productGroups, productVariants } from "./products";
import { compatibilityMappings } from "./compatibility";

// ── Lookup helpers ──

export function getOEMBrandById(id: string): OEMBrand | undefined {
  return oemBrands.find((b) => b.id === id);
}

export function getOEMModelById(id: string): OEMModel | undefined {
  return oemModels.find((m) => m.id === id);
}

export function getProductGroupById(id: string): ProductGroup | undefined {
  return productGroups.find((g) => g.id === id);
}

export function getProductVariantById(id: string): ProductVariant | undefined {
  return productVariants.find((v) => v.id === id);
}

// ── Compatibility queries ──

interface CompatibleProductResult {
  mapping: CompatibilityMapping;
  variant: ProductVariant;
  group: ProductGroup;
}

export function getCompatibleProducts(oemModelId: string): CompatibleProductResult[] {
  return compatibilityMappings
    .filter((m) => m.oemModelId === oemModelId)
    .map((mapping) => {
      const variant = getProductVariantById(mapping.productVariantId);
      const group = variant ? getProductGroupById(variant.groupId) : undefined;
      if (!variant || !group) return null;
      return { mapping, variant, group };
    })
    .filter((r): r is CompatibleProductResult => r !== null);
}

interface CompatibleOEMResult {
  mapping: CompatibilityMapping;
  model: OEMModel;
  brand: OEMBrand;
}

export function getCompatibleOEMModels(productVariantId: string): CompatibleOEMResult[] {
  return compatibilityMappings
    .filter((m) => m.productVariantId === productVariantId)
    .map((mapping) => {
      const model = getOEMModelById(mapping.oemModelId);
      const brand = model ? getOEMBrandById(model.brandId) : undefined;
      if (!model || !brand) return null;
      return { mapping, model, brand };
    })
    .filter((r): r is CompatibleOEMResult => r !== null);
}

export function getOEMBrandModels(brandId: string): OEMModel[] {
  return oemModels.filter((m) => m.brandId === brandId);
}

// ── Search ──

interface SearchResult {
  model: OEMModel;
  brand: OEMBrand;
  compatibleProducts: CompatibleProductResult[];
}

export function searchByPartNumber(query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return oemModels
    .filter((model) =>
      model.oemPartNumbers.some((pn) =>
        pn.toLowerCase().includes(normalizedQuery),
      ),
    )
    .map((model) => {
      const brand = getOEMBrandById(model.brandId);
      if (!brand) return null;
      const compatibleProducts = getCompatibleProducts(model.id);
      return { model, brand, compatibleProducts };
    })
    .filter((r): r is SearchResult => r !== null);
}
```

- [ ] **Step 4: Create barrel export**

```typescript
// src/data/index.ts
export type {
  ProductGroup,
  ProductVariant,
  OEMBrand,
  OEMModel,
  CompatibilityMapping,
} from "./schemas";

export type { I18nText } from "./i18n-types";

export { productGroups, productVariants } from "./products";
export { oemBrands } from "./oem-brands";
export { oemModels } from "./oem-models";
export { compatibilityMappings } from "./compatibility";

export {
  getOEMBrandById,
  getOEMModelById,
  getProductGroupById,
  getProductVariantById,
  getCompatibleProducts,
  getCompatibleOEMModels,
  getOEMBrandModels,
  searchByPartNumber,
} from "./queries";
```

- [ ] **Step 5: Run query tests to verify they pass**

Run: `pnpm exec vitest run src/data/__tests__/queries.test.ts`
Expected: PASS — all 10 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/data/queries.ts src/data/index.ts src/data/__tests__/queries.test.ts
git commit -m "feat(data): add query functions and barrel export

Search by part number, lookup by brand/model/product, compatibility
queries in both directions. All query tests passing."
```

---

## Task 6: Data integrity QA tests

**Files:**
- Create: `src/data/__tests__/data-integrity.test.ts`

- [ ] **Step 1: Write data integrity tests**

```typescript
// src/data/__tests__/data-integrity.test.ts
import { describe, it, expect } from "vitest";
import {
  productGroupSchema,
  productVariantSchema,
  oemBrandSchema,
  oemModelSchema,
  compatibilityMappingSchema,
} from "@/data/schemas";
import { productGroups, productVariants } from "@/data/products";
import { oemBrands } from "@/data/oem-brands";
import { oemModels } from "@/data/oem-models";
import { compatibilityMappings } from "@/data/compatibility";

describe("data integrity", () => {
  describe("schema validation", () => {
    it("all product groups pass Zod validation", () => {
      for (const group of productGroups) {
        expect(() => productGroupSchema.parse(group)).not.toThrow();
      }
    });

    it("all product variants pass Zod validation", () => {
      for (const variant of productVariants) {
        expect(() => productVariantSchema.parse(variant)).not.toThrow();
      }
    });

    it("all OEM brands pass Zod validation", () => {
      for (const brand of oemBrands) {
        expect(() => oemBrandSchema.parse(brand)).not.toThrow();
      }
    });

    it("all OEM models pass Zod validation", () => {
      for (const model of oemModels) {
        expect(() => oemModelSchema.parse(model)).not.toThrow();
      }
    });

    it("all compatibility mappings pass Zod validation", () => {
      for (const mapping of compatibilityMappings) {
        expect(() => compatibilityMappingSchema.parse(mapping)).not.toThrow();
      }
    });
  });

  describe("slug uniqueness", () => {
    it("product group slugs are unique", () => {
      const slugs = productGroups.map((g) => g.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("product variant slugs are unique", () => {
      const slugs = productVariants.map((v) => v.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("OEM brand slugs are unique", () => {
      const slugs = oemBrands.map((b) => b.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("OEM model slugs are unique", () => {
      const slugs = oemModels.map((m) => m.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it("compatibility mapping IDs are unique", () => {
      const ids = compatibilityMappings.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("referential integrity", () => {
    const variantIds = new Set(productVariants.map((v) => v.id));
    const groupIds = new Set(productGroups.map((g) => g.id));
    const modelIds = new Set(oemModels.map((m) => m.id));
    const brandIds = new Set(oemBrands.map((b) => b.id));

    it("all ProductGroup.variantIds reference existing variants", () => {
      for (const group of productGroups) {
        for (const vid of group.variantIds) {
          expect(variantIds.has(vid), `variant ${vid} in group ${group.id}`).toBe(true);
        }
      }
    });

    it("all ProductVariant.groupId references existing group", () => {
      for (const variant of productVariants) {
        expect(groupIds.has(variant.groupId), `group ${variant.groupId} for variant ${variant.id}`).toBe(true);
      }
    });

    it("all OEMBrand.modelIds reference existing models", () => {
      for (const brand of oemBrands) {
        for (const mid of brand.modelIds) {
          expect(modelIds.has(mid), `model ${mid} in brand ${brand.id}`).toBe(true);
        }
      }
    });

    it("all OEMModel.brandId references existing brand", () => {
      for (const model of oemModels) {
        expect(brandIds.has(model.brandId), `brand ${model.brandId} for model ${model.id}`).toBe(true);
      }
    });

    it("all mapping.oemModelId references existing model", () => {
      for (const mapping of compatibilityMappings) {
        expect(modelIds.has(mapping.oemModelId), `model ${mapping.oemModelId} in mapping ${mapping.id}`).toBe(true);
      }
    });

    it("all mapping.productVariantId references existing variant", () => {
      for (const mapping of compatibilityMappings) {
        expect(variantIds.has(mapping.productVariantId), `variant ${mapping.productVariantId} in mapping ${mapping.id}`).toBe(true);
      }
    });
  });

  describe("coverage requirements", () => {
    it("every OEM brand has at least one compatibility mapping", () => {
      for (const brand of oemBrands) {
        const brandModelIds = new Set(brand.modelIds);
        const hasMappings = compatibilityMappings.some((m) =>
          brandModelIds.has(m.oemModelId),
        );
        expect(hasMappings, `brand ${brand.id} has no mappings`).toBe(true);
      }
    });

    it("every compatibility mapping has a confidence value", () => {
      for (const mapping of compatibilityMappings) {
        expect(["high", "medium", "low"]).toContain(mapping.confidence);
      }
    });
  });

  describe("i18n completeness", () => {
    const locales = ["en", "es", "zh"] as const;

    it("all product group names have three locales with non-empty values", () => {
      for (const group of productGroups) {
        for (const locale of locales) {
          expect(group.name[locale].length, `group ${group.id} name.${locale}`).toBeGreaterThan(0);
          expect(group.name[locale]).not.toMatch(/\[(ES|ZH)-TODO\]/);
        }
      }
    });

    it("all product group descriptions have three locales with non-empty values", () => {
      for (const group of productGroups) {
        for (const locale of locales) {
          expect(group.description[locale].length, `group ${group.id} description.${locale}`).toBeGreaterThan(0);
          expect(group.description[locale]).not.toMatch(/\[(ES|ZH)-TODO\]/);
        }
      }
    });

    it("all product variant names have three locales with non-empty values", () => {
      for (const variant of productVariants) {
        for (const locale of locales) {
          expect(variant.name[locale].length, `variant ${variant.id} name.${locale}`).toBeGreaterThan(0);
          expect(variant.name[locale]).not.toMatch(/\[(ES|ZH)-TODO\]/);
        }
      }
    });

    it("all OEM brand disclaimers have three locales with non-empty values", () => {
      for (const brand of oemBrands) {
        for (const locale of locales) {
          expect(brand.trademarkDisclaimer[locale].length, `brand ${brand.id} disclaimer.${locale}`).toBeGreaterThan(0);
          expect(brand.trademarkDisclaimer[locale]).not.toMatch(/\[(ES|ZH)-TODO\]/);
        }
      }
    });
  });

  describe("data volume sanity", () => {
    it("has at least 3 OEM brands", () => {
      expect(oemBrands.length).toBeGreaterThanOrEqual(3);
    });

    it("has at least 10 OEM models", () => {
      expect(oemModels.length).toBeGreaterThanOrEqual(10);
    });

    it("has at least 5 product variants", () => {
      expect(productVariants.length).toBeGreaterThanOrEqual(5);
    });

    it("has at least 15 compatibility mappings", () => {
      expect(compatibilityMappings.length).toBeGreaterThanOrEqual(15);
    });
  });
});
```

- [ ] **Step 2: Run data integrity tests**

Run: `pnpm exec vitest run src/data/__tests__/data-integrity.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 3: Commit**

```bash
git add src/data/__tests__/data-integrity.test.ts
git commit -m "test(data): add data integrity QA tests

Schema validation, slug uniqueness, referential integrity,
coverage requirements, i18n completeness, and data volume sanity."
```

---

## Task 7: Final verification

- [ ] **Step 1: Run type check**

Run: `pnpm type-check`
Expected: zero errors.

- [ ] **Step 2: Run lint**

Run: `pnpm lint:check`
Expected: zero warnings.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: all tests pass (existing 3268 + new data layer tests).

- [ ] **Step 4: Run brand and content checks**

Run: `pnpm brand:check && pnpm content:check`
Expected: both pass.

- [ ] **Step 5: Run Next.js build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 6: Run Cloudflare build**

Run: `pnpm website:build:cf`
Expected: build succeeds. Do NOT run in parallel with `pnpm build`.

- [ ] **Step 7: Update DEVELOPMENT-LOG.md**

Add under the "进行中" section, moving Step 3 to "已完成":

```markdown
### Step 3: 数据层（产品 + 兼容性）— 完成 2026-05-15

- [x] 产品数据 Zod schema（5 个数据类型 + I18nText）
- [x] OEM 品牌和型号数据（3 品牌 / 14 型号 / 真实零件号）
- [x] Tucsenberg 产品数据（5 产品族 / 7 变体 / SKU: TUC-[type][size]-[material]）
- [x] 兼容映射（20 条映射，覆盖 Sanitaire / EDI / SSI）
- [x] 查询函数（按品牌 / 型号 / 产品 / 零件号搜索）
- [x] QA 测试（schema 验证 / slug 唯一 / 引用完整性 / i18n 完整性 / 覆盖率）
- [x] 三语翻译到位（en / es / zh，无占位标记）
```

- [ ] **Step 8: Commit**

```bash
git add DEVELOPMENT-LOG.md
git commit -m "docs: mark Step 3 product data layer complete"
```
