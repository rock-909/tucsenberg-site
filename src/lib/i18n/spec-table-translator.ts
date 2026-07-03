/**
 * Translation utilities for spec tables
 * Maps English display strings to camelCase translation keys
 */

const COLUMN_NAME_TO_KEY: Record<string, string> = {
  Size: "size",
  Angle: "angle",
  "Wall Thickness": "wallThickness",
  "End Type": "endType",
  Radius: "radius",
  Type: "type",
  Length: "length",
  Schedule: "schedule",
  "Bend Radius": "bendRadius",
  Connection: "connection",
  Duty: "duty",
  Material: "material",
  "Outer Diameter": "outerDiameter",
};

const ROW_VALUE_TO_KEY: Record<string, string> = {
  "Bell End": "bellEnd",
  "Plain End": "plainEnd",
  "Standard Coupling": "standardCoupling",
  "Expansion Coupling": "expansionCoupling",
  "Resource Kit": "standardBellmouth",
  "Extended Resource Kit": "heavyDutyBellmouth",
  "Medium Duty": "mediumDuty",
  "Heavy Duty": "heavyDuty",
  "Push-fit": "pushFit",
  Flange: "flange",
  Connector: "connector",
  "90° Bend": "bend90",
  "45° Bend": "bend45",
  "Y-Diverter": "yDiverter",
  "Access Panel": "accessPanel",
  "Specialty Example": "specialty",
  Custom: "custom",
};

/**
 * Map column display name to translation key
 * If not found, returns the display name as-is (for fallback)
 */
function mapColumnNameToKey(columnName: string): string {
  return COLUMN_NAME_TO_KEY[columnName] ?? columnName;
}

/**
 * Map row value to translation key
 * If not found, returns null (value should not be translated)
 */
function mapRowValueToKey(value: string): string | null {
  return ROW_VALUE_TO_KEY[value] ?? null;
}

/**
 * Get translation key path for a column header
 */
export function getColumnTranslationKey(columnName: string): string {
  const key = mapColumnNameToKey(columnName);
  return `specTable.${key}`;
}

/**
 * Get translation key path for a row cell value
 */
export function getRowValueTranslationKey(value: string): string | null {
  const key = mapRowValueToKey(value);
  return key ? `rowValues.${key}` : null;
}

/**
 * Get translation key path for a group label
 */
export function getGroupLabelTranslationKey(
  marketSlug: string,
  familySlug: string,
  groupIndex: number,
): string {
  return `specs.${marketSlug}.families.${familySlug}.groups.${groupIndex}.label`;
}
