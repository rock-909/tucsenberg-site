import { getCanonicalPath } from "@/config/paths/utils";

export const SINGLE_SITE_ROUTE_HREFS = {
  home: getCanonicalPath("home"),
  comingSoon: "#coming-soon",
  about: getCanonicalPath("about"),
  capabilities: getCanonicalPath("capabilities"),
  contact: getCanonicalPath("contact"),
  howItWorks: getCanonicalPath("howItWorks"),
  products: getCanonicalPath("products"),
  blog: getCanonicalPath("blog"),
  privacy: getCanonicalPath("privacy"),
  terms: getCanonicalPath("terms"),
  customProject: getCanonicalPath("customProject"),
} as const;

export const SINGLE_SITE_HOME_LINK_TARGETS = {
  contact: SINGLE_SITE_ROUTE_HREFS.comingSoon,
  products: SINGLE_SITE_ROUTE_HREFS.comingSoon,
} as const;
