import { getTranslations } from "next-intl/server";

import { ChainSectionView } from "@/components/sections/chain-section-view";

const STEP_KEYS = ["step1", "step2", "step3", "step4", "step5"] as const;
const STAT_KEYS = ["stat1", "stat2", "stat3"] as const;

export async function ChainSection() {
  const t = await getTranslations("home");

  const steps = STEP_KEYS.map((key, index) => {
    return {
      num: String(index + 1).padStart(2, "0"),
      title: t(`chain.${key}.title`),
      desc: t(`chain.${key}.desc`),
    };
  });

  const stats = STAT_KEYS.map((key) => t(`chain.${key}`));

  return (
    <ChainSectionView
      title={t("chain.title")}
      subtitle={t("chain.subtitle")}
      steps={steps}
      stats={stats}
    />
  );
}
