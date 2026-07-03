import { getTranslations } from "next-intl/server";

import {
  StarterBoundarySectionView,
  type StarterBoundaryContent,
} from "@/components/sections/starter-boundary-section-view";
import { SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS } from "@/config/single-site-page-expression";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";

export async function StarterBoundarySection() {
  const t = await getTranslations("home");
  const translateHome = (key: string) => t(key as Parameters<typeof t>[0]);

  const content = {
    title: translateHome("startPath.title"),
    description: translateHome("startPath.description"),
    listLabel: translateHome("startPath.title"),
    items: SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS.map((key) => ({
      title: translateHome(`startPath.items.${key}.title`),
      description: translateHome(`startPath.items.${key}.description`),
    })),
    primary: {
      label: translateHome("finalCta.primary"),
      href: SINGLE_SITE_ROUTE_HREFS.products,
    },
    secondary: {
      label: translateHome("finalCta.secondary"),
      href: SINGLE_SITE_ROUTE_HREFS.requestQuote,
    },
  } satisfies StarterBoundaryContent;

  return <StarterBoundarySectionView content={content} />;
}
