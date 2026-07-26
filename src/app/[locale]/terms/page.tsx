import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { LegalPageShell } from "@/components/content/legal-page-shell";
import { loadLegalPage } from "@/lib/content/legal-page";
import {
  createStaticPageMetadataConfig,
  generateMetadataForPath,
  type Locale,
} from "@/lib/seo-metadata";
import { getLocalizedPath } from "@/config/paths";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface TermsPageProps {
  params: Promise<LocaleParam>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { metadata } = await loadLegalPage("terms", locale);

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "terms",
    path: getLocalizedPath("terms", locale as Locale),
    config: createStaticPageMetadataConfig(metadata, {
      includeEmptyDescription: true,
    }),
  });
}

// 本页在构建期就整页预渲染，没有请求期数据可等，加 Suspense 只会让正文
// 流到 <main> 外的隐藏容器里；禁用脚本的访客于是永远停在骨架屏上。
export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { metadata, content, headings } = await loadLegalPage("terms", locale);

  return (
    <LegalPageShell
      metadata={metadata}
      content={content}
      headings={headings}
      locale={locale}
      schemaType="WebPage"
      pagePath={getLocalizedPath("terms", locale as Locale)}
    />
  );
}
