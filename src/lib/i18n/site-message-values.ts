import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

// 构建时固化：静态预渲染时评估一次，跨年后需重新构建才会更新页脚年份。
const BUILD_UTC_YEAR = String(new Date().getUTCFullYear());

export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
}

export function getSiteMessageValues(): SiteMessageValues {
  return {
    siteName: SINGLE_SITE_CONFIG.name,
    companyName: SINGLE_SITE_FACTS.company.name,
    currentYear: BUILD_UTC_YEAR,
  };
}
