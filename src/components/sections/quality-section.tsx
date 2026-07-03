import { getTranslations } from "next-intl/server";

import {
  QualitySectionView,
  type QualityProofItem,
  type QualitySectionContent,
  type QualityStandardStatus,
} from "@/components/sections/quality-section-view";
import {
  SINGLE_SITE_HOME_QUALITY_COMMITMENT_ITEMS,
  SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS,
  SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS,
} from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";

const APPLYING_STANDARD_KEY = "exampleB";
type QualityProofStripItemKey =
  (typeof SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS)[number];

function assertNever(value: never): never {
  throw new Error(`Unhandled quality proof item: ${String(value)}`);
}

function buildProofItem(
  item: QualityProofStripItemKey,
  t: Awaited<ReturnType<typeof getTranslations>>,
): QualityProofItem {
  switch (item) {
    case "iso9001":
      return {
        key: item,
        value: "ISO 9001",
        label: t("certifications.certified"),
      };
    case "standards":
      return {
        key: item,
        value: String(SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS.length),
        label: t("proofStrip.standards"),
      };
    case "countries":
      return {
        key: item,
        value: `${String(siteFacts.stats.exportCountries)}+`,
        label: t("proofStrip.countries"),
      };
    default:
      return assertNever(item);
  }
}

function buildProofItems(
  t: Awaited<ReturnType<typeof getTranslations>>,
): QualityProofItem[] {
  return SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS.map((item) =>
    buildProofItem(item, t),
  );
}

export async function QualitySection() {
  const t = await getTranslations("home.quality");
  const translateQuality = (key: string) => t(key as Parameters<typeof t>[0]);

  const content = {
    title: t("title"),
    subtitle: t("subtitle"),
    commitments: SINGLE_SITE_HOME_QUALITY_COMMITMENT_ITEMS.map((key) => ({
      key,
      title: t(`${key}.title`),
      description: t(`${key}.desc`),
    })),
    certificationsTitle: t("certifications.title"),
    certificationName: t("certifications.iso9001"),
    certificationNumber: t("certifications.iso9001Num"),
    certifiedLabel: t("certifications.certified"),
    applyingLabel: t("certifications.applying"),
    compliantLabel: t("certifications.compliant"),
    standards: SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS.map((key) => {
      const status: QualityStandardStatus =
        key === APPLYING_STANDARD_KEY ? "applying" : "compliant";

      return {
        key,
        label: translateQuality(`standards.${key}`),
        status,
      };
    }),
    proofTitle: t("logoWall"),
    proofNote: t("proofStrip.note"),
    proofItems: buildProofItems(t),
  } satisfies QualitySectionContent;

  return <QualitySectionView content={content} />;
}
