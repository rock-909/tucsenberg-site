export const PRODUCT_STANDARDS = {
  example_a: {
    label: "Example Standard A",
  },
  example_b: {
    label: "Example Standard B",
  },
  example_c: {
    label: "Example Standard C",
  },
  example_d: {
    label: "Example Standard D",
  },
  specialty: {
    label: "Specialty Example",
  },
} as const satisfies Record<string, { label: string }>;

/**
 * @public Starter catalog contract: downstream projects can enumerate supported standard ids.
 */
export const PRODUCT_STANDARD_IDS = Object.keys(
  PRODUCT_STANDARDS,
) as readonly ProductStandardId[];

export type ProductStandardId = keyof typeof PRODUCT_STANDARDS;
