import { getTranslations } from "next-intl/server";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import {
  type StaticIconComponent,
  StaticAwardIcon,
  StaticFileTextIcon,
  StaticFolderOpenIcon,
  StaticPencilRulerIcon,
} from "@/components/icons/static-icons";
import { ResourcesSectionView } from "@/components/sections/resources-section-view";

const RESOURCE_COUNT = 4;

const ICONS: StaticIconComponent[] = [
  StaticFolderOpenIcon,
  StaticFileTextIcon,
  StaticPencilRulerIcon,
  StaticAwardIcon,
];

export async function ResourcesSection() {
  const t = await getTranslations("home");

  const resources = Array.from({ length: RESOURCE_COUNT }, (_, i) => {
    const key = `item${String(i + 1)}`;
    // ICONS length matches RESOURCE_COUNT — safe access
    const Icon = ICONS[i]!;
    return {
      Icon,
      title: t(`resources.${key}.title`),
      desc: t(`resources.${key}.desc`),
      link: t(`resources.${key}.link`) as LinkHref,
    };
  });

  return (
    <ResourcesSectionView
      title={t("resources.title")}
      subtitle={t("resources.subtitle")}
      resources={resources}
    />
  );
}
