import { getTranslations } from "next-intl/server";

import { ChainSectionView } from "@/components/sections/chain-section-view";

const STEP_COUNT = 5;
const STAT_COUNT = 3;

export async function ChainSection() {
  const t = await getTranslations("home");

  const steps = Array.from({ length: STEP_COUNT }, (_, i) => {
    const key = `step${String(i + 1)}`;
    return {
      num: String(i + 1).padStart(2, "0"),
      title: t(`chain.${key}.title`),
      desc: t(`chain.${key}.desc`),
    };
  });

  const stats = Array.from({ length: STAT_COUNT }, (_, i) =>
    t(`chain.stat${String(i + 1)}`),
  );

  return (
    <ChainSectionView
      title={t("chain.title")}
      subtitle={t("chain.subtitle")}
      steps={steps}
      stats={stats}
    />
  );
}
