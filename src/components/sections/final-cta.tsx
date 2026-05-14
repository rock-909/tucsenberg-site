import { getTranslations } from "next-intl/server";

import {
  FinalCTAView,
  type FinalCtaContent,
  type FinalCtaTrustItem,
} from "@/components/sections/final-cta-view";
import { SINGLE_SITE_HOME_FINAL_TRUST_ITEMS } from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

function assertNever(value: never): never {
  throw new Error(`Unhandled final CTA trust item: ${String(value)}`);
}

export async function FinalCTA() {
  const t = await getTranslations("home.finalCta");
  const trustItems =
    SINGLE_SITE_HOME_FINAL_TRUST_ITEMS.flatMap<FinalCtaTrustItem>((item) => {
      switch (item) {
        case "countries":
          return [
            {
              key: item,
              value: t("trust", {
                countries: siteFacts.stats.exportCountries,
              }),
            },
          ];
        default:
          return assertNever(item);
      }
    });

  const content = {
    title: t("title"),
    description: t("description"),
    primary: {
      label: t("primary"),
      href: HOMEPAGE_SECTION_LINKS.contact,
    },
    secondary: {
      label: t("secondary"),
      href: HOMEPAGE_SECTION_LINKS.products,
    },
    trustAriaLabel: t("trustAriaLabel"),
    trustItems,
  } satisfies FinalCtaContent;

  return <FinalCTAView content={content} />;
}
