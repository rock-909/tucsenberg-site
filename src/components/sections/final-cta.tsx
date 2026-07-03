import { getTranslations } from "next-intl/server";

import {
  FinalCTAView,
  type FinalCtaContent,
  type FinalCtaAction,
  type FinalCtaTrustItem,
} from "@/components/sections/final-cta-view";
import { SINGLE_SITE_HOME_FINAL_TRUST_ITEMS } from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";
import { getSingleSiteHomeFinalCtaTargets } from "@/config/single-site-links";

function assertNever(value: never): never {
  throw new Error(`Unhandled final CTA trust item: ${String(value)}`);
}

export async function FinalCTA() {
  const t = await getTranslations("home.finalCta");
  const ctaTargets = getSingleSiteHomeFinalCtaTargets();
  const actionEntries = ctaTargets.map((target) => [
    target.labelKey,
    {
      label: t(target.labelKey),
      href: target.href,
    },
  ]) satisfies Array<["primary" | "secondary", FinalCtaAction]>;
  const actions = Object.fromEntries(actionEntries) as Partial<
    Record<"primary" | "secondary", FinalCtaAction>
  >;
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
    ...(actions.primary ? { primary: actions.primary } : {}),
    ...(actions.secondary ? { secondary: actions.secondary } : {}),
    trustAriaLabel: t("trustAriaLabel"),
    trustItems,
  } satisfies FinalCtaContent;

  return <FinalCTAView content={content} />;
}
