import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
  copyright: {
    en: string;
    zh: string;
  };
}

export function getSiteMessageValues(): SiteMessageValues {
  const companyName = SINGLE_SITE_FACTS.company.name;
  const currentYear = String(
    SINGLE_SITE_FACTS.company.established +
      SINGLE_SITE_FACTS.company.yearsInBusiness,
  );

  return {
    siteName: SINGLE_SITE_CONFIG.name,
    companyName,
    currentYear,
    // Short brand mark: the footer legal bar already carries the full legal
    // company name, so the copyright line stays brand-short by design.
    copyright: {
      en: `© ${currentYear} ${SINGLE_SITE_CONFIG.name}. All rights reserved.`,
      zh: `© ${currentYear} ${SINGLE_SITE_CONFIG.name}。保留所有权利。`,
    },
  };
}
