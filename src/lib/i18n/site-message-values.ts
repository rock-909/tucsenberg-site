import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
}

const CURRENT_YEAR = "2026";

export function getSiteMessageValues(): SiteMessageValues {
  return {
    siteName: SINGLE_SITE_CONFIG.name,
    companyName: SINGLE_SITE_FACTS.company.name,
    currentYear: CURRENT_YEAR,
  };
}
