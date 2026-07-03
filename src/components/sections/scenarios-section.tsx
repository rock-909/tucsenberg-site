import { getTranslations } from "next-intl/server";

import {
  ScenariosSectionView,
  type ScenarioSectionIconKey,
  type ScenarioSectionItem,
} from "@/components/sections/scenarios-section-view";
import { SINGLE_SITE_HOME_SCENARIO_ITEMS } from "@/config/single-site-page-expression";
import { siteFacts } from "@/config/site-facts";

const SCENARIO_ICON_KEYS: Partial<
  Record<
    (typeof SINGLE_SITE_HOME_SCENARIO_ITEMS)[number],
    ScenarioSectionIconKey
  >
> = {
  item1: "product",
  item2: "service",
  item3: "custom",
};

export async function ScenariosSection() {
  const t = await getTranslations("home.scenarios");
  const items = SINGLE_SITE_HOME_SCENARIO_ITEMS.map((key, index) => ({
    key,
    iconKey: SCENARIO_ICON_KEYS[key] ?? "default",
    eyebrow: t("cardEyebrow", { count: index + 1 }),
    badge: t("countryBadge", {
      countries: siteFacts.stats.exportCountries,
    }),
    title: t(`${key}.title`),
    description: t(`${key}.desc`),
    proofLabel: t("proofLabel"),
    quote: t(`${key}.quote`),
  })) satisfies ScenarioSectionItem[];

  return (
    <ScenariosSectionView
      title={t("title")}
      subtitle={t("subtitle", { countries: siteFacts.stats.exportCountries })}
      items={items}
    />
  );
}
