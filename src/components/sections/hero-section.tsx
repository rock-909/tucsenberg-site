import { getTranslations } from "next-intl/server";

import {
  HeroSectionView,
  type HeroSectionContent,
} from "@/components/sections/hero-section-view";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";
import { SINGLE_SITE_HOME_HERO_PROOF_ITEMS } from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";
import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";

type HeroProofItemKey = (typeof SINGLE_SITE_HOME_HERO_PROOF_ITEMS)[number];

function assertNever(value: never): never {
  throw new Error(`Unhandled hero proof item: ${String(value)}`);
}

function buildHeroProofItem(
  item: HeroProofItemKey,
  t: Awaited<ReturnType<typeof getTranslations<"home">>>,
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

  const boxwallDiagram = ABS_FLOOD_BARRIERS_PRODUCT_PAGE.diagram;
  if (!boxwallDiagram || boxwallDiagram.kind !== "boxwall") {
    throw new Error("Hero boxwall diagram is missing from product constants");
  }

  const content = {
    eyebrow: t("hero.eyebrow", {
      established: siteFacts.company.established,
    }),
    title: t("hero.title"),
    subtitle: t("hero.subtitle"),
    primaryCta: {
      label: t("hero.cta.primary"),
      href: SINGLE_SITE_HOME_LINK_TARGETS.primaryCta,
    },
    secondaryCta: {
      label: t("hero.cta.secondary"),
      href: SINGLE_SITE_HOME_LINK_TARGETS.secondaryCta,
    },
    proofAriaLabel: t("hero.proofAriaLabel"),
    proofItems,
    diagram: {
      kind: "boxwall",
      labels: boxwallDiagram.labels,
      panelLabel: t("hero.diagram.panelLabel"),
      ariaLabel: t("hero.diagram.ariaLabel"),
      caption: t("hero.diagram.caption"),
    },
  } satisfies HeroSectionContent;

  return <HeroSectionView content={content} />;
}
