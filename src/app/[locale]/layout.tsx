import { generateLocaleMetadata } from "@/app/[locale]/layout-metadata";
import "@/app/globals.css";
import { type ReactNode, Suspense } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFontClassNames } from "@/app/[locale]/layout-fonts";
import { AttributionBootstrap } from "@/components/attribution-bootstrap";
import { LazyCookieConsentIsland } from "@/components/cookie/lazy-cookie-consent-island";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/layout/header";
import { NavigationProgressBar } from "@/components/navigation/navigation-progress-bar";
import { LightMotionProvider } from "@/components/motion/light-motion-provider";
import { PageTransition } from "@/components/motion/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { LazyThemeSwitcher } from "@/components/ui/lazy-theme-switcher";
import { FOOTER_COLUMNS, FOOTER_STYLE_TOKENS } from "@/config/footer-links";
import { coerceLocale, isLocale } from "@/i18n/locale-utils";
import { loadClientMessages } from "@/lib/i18n/client-messages";
import { mainNavigation } from "@/lib/navigation";
import type { Locale } from "@/i18n/routing-config";

// Client analytics are rendered as an island to avoid impacting LCP

// 重新导出元数据生成函数
export const generateMetadata = generateLocaleMetadata;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}
interface AsyncLocaleLayoutContentProps {
  locale: Locale;
  children: ReactNode;
}

async function AsyncLocaleLayoutContent({
  locale,
  children,
}: AsyncLocaleLayoutContentProps) {
  // Do not read runtime headers here; Cache Components need this layout to stay
  // prerenderable. Static CSP is emitted from next.config.ts.

  const [tFooter, tNavigation, tAccessibility, tLanguage, clientMessages] =
    await Promise.all([
      getTranslations({
        locale,
        namespace: "footer",
      }),
      getTranslations({
        locale,
        namespace: "navigation",
      }),
      getTranslations({
        locale,
        namespace: "accessibility",
      }),
      getTranslations({
        locale,
        namespace: "language",
      }),
      loadClientMessages(locale),
    ]);

  const footerSystemStatus = tFooter("systemStatus");
  const contactSalesLabel = tNavigation("contactSales");
  const openMenuLabel = tAccessibility("openMenu");
  const closeMenuLabel = tAccessibility("closeMenu");
  const skipToContentLabel = tAccessibility("skipToContent");
  const mobileLanguageLabel = tLanguage("selectLanguage");
  const mainNavItems = mainNavigation.map((item) => ({
    key: item.key,
    href: item.href,
    label: tNavigation(
      item.translationKey.replace(/^navigation\./, "") as Parameters<
        typeof tNavigation
      >[0],
    ),
  }));

  return (
    <>
      <a href="#main-content" className="skip-link">
        {skipToContentLabel}
      </a>
      <NextIntlClientProvider locale={locale} messages={clientMessages}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LightMotionProvider>
            <NavigationProgressBar />
            {/* P1-1 Fix: Single attribution initialization for UTM tracking */}
            <AttributionBootstrap />

            {/* 导航栏 */}
            <Header
              locale={locale}
              contactSalesLabel={contactSalesLabel}
              openMenuLabel={openMenuLabel}
              closeMenuLabel={closeMenuLabel}
              mobileLanguageLabel={mobileLanguageLabel}
              mainNavItems={mainNavItems}
            />

            {/* 主要内容 */}
            <main id="main-content" className="flex-1">
              <Suspense fallback={children}>
                <PageTransition>{children}</PageTransition>
              </Suspense>
            </main>

            {/* 页脚：使用新 Footer 组件与配置数据，附加主题切换与状态插槽 */}
            <Footer
              columns={FOOTER_COLUMNS}
              tokens={FOOTER_STYLE_TOKENS}
              statusSlot={
                <span className="text-xs font-medium text-[var(--footer-text)] sm:text-sm">
                  {footerSystemStatus}
                </span>
              }
              themeToggleSlot={
                <LazyThemeSwitcher data-testid="footer-theme-toggle" />
              }
            />

            {/* Consent UI and analytics are deferred until the main thread is idle. */}
            <LazyCookieConsentIsland />
          </LightMotionProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!isLocale(locale)) {
    notFound();
  }

  const typedLocale = coerceLocale(locale);
  setRequestLocale(typedLocale);

  return (
    <html
      lang={typedLocale}
      className={getFontClassNames()}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <AsyncLocaleLayoutContent locale={typedLocale}>
          {children}
        </AsyncLocaleLayoutContent>
      </body>
    </html>
  );
}
