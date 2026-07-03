import { getTranslations } from "next-intl/server";

import {
  StarterBoundarySectionView,
  type StarterBoundaryContent,
} from "@/components/sections/starter-boundary-section-view";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";

const STARTER_BOUNDARY_ITEM_COUNT = 4;

export async function StarterBoundarySection() {
  const t = await getTranslations("home.starterBoundary");

  const content = {
    title: t("title"),
    description: t("description"),
    listLabel: t("listLabel"),
    items: Array.from({ length: STARTER_BOUNDARY_ITEM_COUNT }, (_, index) => ({
      title: t(`items.${index}.title`),
      description: t(`items.${index}.description`),
    })),
    primary: {
      label: t("primary"),
      href: SINGLE_SITE_ROUTE_HREFS.howItWorks,
    },
    secondary: {
      label: t("secondary"),
      href: SINGLE_SITE_ROUTE_HREFS.contact,
    },
  } satisfies StarterBoundaryContent;

  return <StarterBoundarySectionView content={content} />;
}
