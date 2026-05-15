import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import type { SiteNavigationItem } from "@/config/site-types";

export type { SiteNavigationItem } from "@/config/site-types";

export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] = [
  {
    key: "membranes",
    href: "/membranes/tuc-d9-epdm",
    translationKey: "navigation.membranes",
  },
  {
    key: "compatibility",
    href: "/compatible/sanitaire",
    translationKey: "navigation.compatibility",
  },
  {
    key: "materials",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.materials",
  },
  {
    key: "quote",
    href: SINGLE_SITE_ROUTE_HREFS.quote,
    translationKey: "navigation.quote",
  },
];
