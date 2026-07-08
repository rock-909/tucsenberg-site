import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FOOTER_COLUMNS, type FooterColumnConfig } from "@/config/footer-links";
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";
import { Link } from "@/i18n/routing";

/**
 * Hairline B2B footer: wide brand column + two link columns over a legal
 * identity bar. Flat surface, no colour blocks — the only accent is the
 * wordmark's "=" mark. Spec: docs/design/可迁移设计资产-剖面动画与页脚.md.
 */

export interface FooterProps {
  /** 页脚链接列配置，默认使用 single-site 的 Navigation / Support 两列 */
  columns?: FooterColumnConfig[];
  /** 主题切换插槽（如 ThemeSwitcher），渲染在法务条右侧 */
  themeToggleSlot?: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 可选 data-theme 透传，方便在独立渲染时指定主题 */
  dataTheme?: string;
}

type TranslateWithFallback = (
  key: string | undefined,
  fallback: string,
  values?: Record<string, string | number>,
) => string;

const MICRO_LABEL_CLASS =
  "font-mono text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--footer-heading)]";
const LEGAL_TEXT_CLASS =
  "font-mono text-[11.5px] leading-5 text-[var(--footer-text)]";
const LINK_CLASS =
  "block py-1.5 text-sm leading-6 text-[var(--footer-text)] transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

function FooterSection({
  section,
  translate,
}: {
  section: FooterColumnConfig;
  translate: TranslateWithFallback;
}) {
  return (
    <section aria-labelledby={`${section.key}-heading`}>
      <h2 id={`${section.key}-heading`} className={MICRO_LABEL_CLASS}>
        {translate(section.translationKey, section.title)}
      </h2>
      <ul className="mt-3">
        {section.links.map((link) => (
          <li key={link.key}>
            {link.external ? (
              <a
                className={LINK_CLASS}
                href={link.href}
                rel="noreferrer noopener"
                target="_blank"
              >
                {translate(link.translationKey, link.label)}
              </a>
            ) : (
              <Link
                className={LINK_CLASS}
                href={link.href as "/privacy" | "/terms"}
                prefetch={false}
              >
                {translate(link.translationKey, link.label)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footer({
  columns = FOOTER_COLUMNS,
  themeToggleSlot,
  className,
  dataTheme,
}: FooterProps) {
  const t = useTranslations();
  const translateDynamicKey = t as unknown as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const translateWithFallback: TranslateWithFallback = (
    key,
    fallback,
    values,
  ) => {
    if (!key) return fallback;
    try {
      const translated = translateDynamicKey(key, { fallback, ...values });
      return translated === key ? fallback : translated;
    } catch {
      return fallback;
    }
  };

  const { name: siteName } = SINGLE_SITE_CONFIG;
  const { name: companyName } = SINGLE_SITE_FACTS.company;
  const { email } = SINGLE_SITE_CONFIG.contact;
  // Pure facts, no translatable words — composed from config, not messages.
  const legalLine = `${companyName} · ${email}`;
  // "{copyright}" placeholder is interpolated from single-site config by the
  // message loader at runtime; the fallback mirrors that composed value.
  // Config snapshot year, not new Date(): Cache Components forbid current-time
  // reads during prerender.
  const snapshotYear =
    SINGLE_SITE_FACTS.company.established +
    SINGLE_SITE_FACTS.company.yearsInBusiness;
  const copyright = translateWithFallback(
    "footer.copyright",
    `© ${snapshotYear} ${siteName}. All rights reserved.`,
  );

  return (
    <footer
      className={cn(
        "border-t border-[var(--footer-divider)] bg-[var(--footer-bg)]",
        className,
      )}
      data-theme={dataTheme}
    >
      <div className="mx-auto max-w-[1080px] px-6 py-12 md:py-14">
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-[1.4fr_2fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--footer-heading)]">
              <span className="sr-only">{siteName}</span>
              <span aria-hidden="true">
                TUCS
                <span className="text-primary">=</span>
                NBERG
              </span>
            </p>
            <p className="mt-3 max-w-[34ch] text-[13px] leading-6 text-[var(--footer-text)]">
              {translateWithFallback(
                "footer.description",
                SINGLE_SITE_CONFIG.description,
              )}
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-10"
          >
            {columns.map((section) => (
              <FooterSection
                key={section.key}
                section={section}
                translate={translateWithFallback}
              />
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--footer-divider)] pt-6">
          <p className={LEGAL_TEXT_CLASS}>{legalLine}</p>
          <div className="flex items-center gap-4">
            <p className={LEGAL_TEXT_CLASS}>{copyright}</p>
            {themeToggleSlot}
          </div>
        </div>
      </div>
    </footer>
  );
}
