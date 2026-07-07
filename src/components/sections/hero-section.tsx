import { getTranslations } from "next-intl/server";

import {
  HeroSectionView,
  type HeroSectionContent,
} from "@/components/sections/hero-section-view";
import { SINGLE_SITE_HOME_HERO_PROOF_ITEMS } from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

type HeroProofItemKey = (typeof SINGLE_SITE_HOME_HERO_PROOF_ITEMS)[number];

function assertNever(value: never): never {
  throw new Error(`Unhandled hero proof item: ${String(value)}`);
}

function buildHeroProofItem(
  item: HeroProofItemKey,
  t: Awaited<ReturnType<typeof getTranslations>>,
): HeroSectionContent["proofItems"][number] {
  switch (item) {
    case "est":
      return {
        value: t("hero.proof.est", {
          established: siteFacts.company.established,
        }),
        label: t("hero.proof.estLabel"),
      };
    case "countries":
      return {
        value: t("hero.proof.countries", {
          countries: siteFacts.stats.exportCountries,
        }),
        label: t("hero.proof.countriesLabel"),
      };
    case "range":
      return {
        value: t("hero.proof.range"),
        label: t("hero.proof.rangeLabel"),
      };
    case "production":
      return {
        value: t("hero.proof.production"),
        label: t("hero.proof.productionLabel"),
      };
    default:
      return assertNever(item);
  }
}

export async function HeroSection() {
  const t = await getTranslations("home");
  const proofItems = SINGLE_SITE_HOME_HERO_PROOF_ITEMS.map((item) =>
    buildHeroProofItem(item, t),
  );

  const content = {
    eyebrow: t("hero.eyebrow", {
      established: siteFacts.company.established,
    }),
    title: t("hero.title"),
    subtitle: t("hero.subtitle"),
    primaryCta: {
      label: t("hero.cta.primary"),
      href: HOMEPAGE_SECTION_LINKS.primaryCta,
    },
    secondaryCta: {
      label: t("hero.cta.secondary"),
      href: HOMEPAGE_SECTION_LINKS.secondaryCta,
    },
    proofAriaLabel: t("hero.proofAriaLabel"),
    proofItems,
    preview: {
      label: t("hero.preview.label"),
      title: t("hero.preview.title"),
      description: t("hero.preview.description"),
      items: [
        t("hero.preview.productSystem"),
        t("hero.preview.applicationFit"),
        t("hero.preview.deliveryProof"),
        t("hero.preview.inquiryPath"),
      ],
      itemGlyphs: ["boxwall", "gate", "bag", "tube"],
    },
  } satisfies HeroSectionContent;

  return <HeroSectionView content={content} />;
}
