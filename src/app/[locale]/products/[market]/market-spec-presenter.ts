import type { MarketSpecs, SpecGroup } from "@/constants/product-specs/types";
import {
  getColumnTranslationKey,
  getGroupLabelTranslationKey,
  getRowValueTranslationKey,
} from "@/lib/i18n/spec-table-translator";

export interface MarketTrustSignalsViewModel {
  translatedTechnical: Record<string, string>;
  certifications: string[];
  translatedTrade: {
    moq: string;
    leadTime: string;
    supplyCapacity: string;
    packaging: string;
    portOfLoading: string;
  };
  technicalTitle: string;
  certificationsTitle: string;
  tradeTitle: string;
  tradeLabels: {
    moq: string;
    leadTime: string;
    supplyCapacity: string;
    packaging: string;
    portOfLoading: string;
  };
}

function translateSpecColumns(
  columns: string[],
  t: (key: string) => string,
): string[] {
  return columns.map((column) => t(getColumnTranslationKey(column)));
}

function translateSpecRows(
  rows: string[][],
  t: (key: string) => string,
): string[][] {
  return rows.map((row) =>
    row.map((cell) => {
      const cellKey = getRowValueTranslationKey(cell);
      return cellKey ? t(cellKey) : cell;
    }),
  );
}

function translateTechnicalSpecs(
  technical: Record<string, string>,
  marketSlug: string,
  t: (key: string) => string,
): Record<string, string> {
  const translated: Record<string, string> = {};
  for (const key of Object.keys(technical)) {
    translated[t(`technicalLabels.${key}`)] = t(
      `specs.${marketSlug}.technical.${key}`,
    );
  }

  return translated;
}

export function buildTrustSignalsViewModel(
  marketSpecs: MarketSpecs,
  marketSlug: string,
  t: (key: string) => string,
): MarketTrustSignalsViewModel {
  return {
    translatedTechnical: translateTechnicalSpecs(
      marketSpecs.technical,
      marketSlug,
      t,
    ),
    certifications: marketSpecs.certifications,
    translatedTrade: {
      moq: t(`specs.${marketSlug}.trade.moq`),
      leadTime: t(`specs.${marketSlug}.trade.leadTime`),
      supplyCapacity: t(`specs.${marketSlug}.trade.supplyCapacity`),
      packaging: t(`specs.${marketSlug}.trade.packaging`),
      portOfLoading: t(`specs.${marketSlug}.trade.portOfLoading`),
    },
    technicalTitle: t("market.technical.title"),
    certificationsTitle: t("market.certifications.title"),
    tradeTitle: t("market.trade.title"),
    tradeLabels: {
      moq: t("market.trade.moq"),
      leadTime: t("market.trade.leadTime"),
      supplyCapacity: t("market.trade.supplyCapacity"),
      packaging: t("market.trade.packaging"),
      portOfLoading: t("market.trade.portOfLoading"),
    },
  };
}

export function buildTranslatedFamilySpecs({
  specs,
  marketSlug,
  familySlug,
  t,
}: {
  specs: MarketSpecs["families"][number];
  marketSlug: string;
  familySlug: string;
  t: (key: string) => string;
}): MarketSpecs["families"][number] {
  const translatedSpecGroups: SpecGroup[] = specs.specGroups.map(
    (group, groupIndex) => ({
      ...group,
      groupLabel: t(
        getGroupLabelTranslationKey(marketSlug, familySlug, groupIndex),
      ),
      columns: translateSpecColumns(group.columns, t),
      rows: translateSpecRows(group.rows, t),
    }),
  );

  return {
    ...specs,
    highlights: specs.highlights.map((_, index) =>
      t(`specs.${marketSlug}.families.${familySlug}.highlights.${index}`),
    ),
    specGroups: translatedSpecGroups,
  };
}
