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
    copyright: {
      en: `(c) ${currentYear} ${companyName}. All rights reserved.`,
      zh: `(c) ${currentYear} ${companyName}。保留所有权利。`,
    },
  };
}
