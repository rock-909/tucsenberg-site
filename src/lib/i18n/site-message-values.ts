import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";

export interface SiteMessageValues {
  siteName: string;
  companyName: string;
  currentYear: string;
}

// eslint-disable-next-line require-await -- use cache 函数按 Next Cache Components 规范必须 async，函数体内无需 await。
export async function getSiteMessageValues(): Promise<SiteMessageValues> {
  "use cache";

  // 构建时 UTC 年份：缓存键含 Build ID，每个 build 重新捕获一次并固化；
  // 同一 build 内复用缓存，静态预渲染把结果写进静态 HTML。
  const currentYear = String(new Date().getUTCFullYear());

  return {
    siteName: SINGLE_SITE_CONFIG.name,
    companyName: SINGLE_SITE_FACTS.company.name,
    currentYear,
  };
}
