import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ExternalLinkIcon,
  SocialIconMapper,
} from "@/components/ui/social-icons";
import {
  FOOTER_COLUMNS,
  FOOTER_STYLE_TOKENS,
  type FooterColumnConfig,
  type FooterStyleTokens,
} from "@/config/footer-links";
import { Link } from "@/i18n/routing";

export interface FooterProps {
  /** 页脚列配置，默认使用 starter 四列数据 */
  columns?: FooterColumnConfig[];
  /** 自定义样式 token，默认使用 FOOTER_STYLE_TOKENS */
  tokens?: FooterStyleTokens;
  /** 状态插槽（如版权、运行状态） */
  statusSlot?: ReactNode;
  /** 主题切换插槽（如 ThemeSwitcher） */
  themeToggleSlot?: ReactNode;
  /** 额外类名 */
  className?: string;
  /** 可选 data-theme 透传，方便在独立渲染时指定主题 */
  dataTheme?: string;
}

interface FooterSectionProps {
  section: FooterColumnConfig;
  translate: (key: string | undefined, fallback: string) => string;
  linkClassName: string;
  linkStyle: CSSProperties;
  titleStyle: CSSProperties;
}

function FooterSection({
  section,
  translate,
  linkClassName,
  linkStyle,
  titleStyle,
}: FooterSectionProps) {
  const isSocial = section.key === "social";

  return (
    <section aria-labelledby={`${section.key}-heading`} className="space-y-4">
      <h2
        id={`${section.key}-heading`}
        className="text-[var(--footer-heading)]"
        style={titleStyle}
      >
        {translate(section.translationKey, section.title)}
      </h2>
      <ul className="space-y-2">
        {section.links.map((link) => {
          const content = (
            <>
              {isSocial ? (
                <SocialIconMapper platform={link.key} size={16} />
              ) : null}
              <span>{translate(link.translationKey, link.label)}</span>
              {link.showExternalIcon && !isSocial ? (
                <ExternalLinkIcon size={12} />
              ) : null}
            </>
          );

          return (
            <li key={link.key}>
              {link.external ? (
                <a
                  className={linkClassName}
                  href={link.href}
                  rel="noreferrer noopener"
                  style={linkStyle}
                  target="_blank"
                >
                  {content}
                </a>
              ) : (
                <Link
                  className={linkClassName}
                  href={link.href as "/privacy" | "/terms"}
                  prefetch={false}
                  style={linkStyle}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Footer({
  columns = FOOTER_COLUMNS,
  tokens = FOOTER_STYLE_TOKENS,
  statusSlot,
  themeToggleSlot,
  className,
  dataTheme,
}: FooterProps) {
  const t = useTranslations();
  const translateDynamicKey = t as unknown as (
    key: string,
    values?: Record<string, string>,
  ) => string;

  const translateWithFallback = (key: string | undefined, fallback: string) => {
    if (!key) return fallback;
    try {
      const translated = translateDynamicKey(key, { fallback });
      return translated === key ? fallback : translated;
    } catch {
      return fallback;
    }
  };

  const { layout, typography, colors, hover } = tokens;

  const containerStyle: CSSProperties = {
    maxWidth: `${layout.maxWidthPx}px`,
    marginInline: layout.containerMarginInline,
  };

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${layout.minColumnWidthPx}px, 1fr))`,
    columnGap: `${layout.gapPx.column}px`,
    rowGap: `${layout.gapPx.row}px`,
  };

  const titleStyle: CSSProperties = {
    fontSize: `${typography.title.fontSizePx}px`,
    lineHeight: `${typography.title.lineHeightPx}px`,
    fontWeight: typography.title.fontWeight,
    letterSpacing: typography.title.letterSpacing,
    fontFamily: typography.fontFamily,
  };

  const linkStyle: CSSProperties = {
    fontSize: `${typography.link.fontSizePx}px`,
    lineHeight: `${typography.link.lineHeightPx}px`,
    fontWeight: typography.link.fontWeight,
    fontFamily: typography.fontFamily,
  };

  const linkClassName = cn(
    "inline-flex min-h-11 items-center gap-2 px-0 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
    hover.transition,
    colors.light.text,
    colors.dark.text,
    colors.light.hoverText,
    colors.dark.hoverText,
    hover.light.underline || hover.dark.underline ? "hover:underline" : null,
  );

  return (
    <footer
      className={cn(
        "border-t border-[var(--footer-divider)] bg-[var(--footer-bg)] text-[var(--footer-text)]",
        className,
      )}
      data-theme={dataTheme}
    >
      <div
        className={cn(
          // 内边距跟随 token，且与布局 px-4/6/8 对齐
          "px-4 md:px-6 lg:px-8",
          "py-12 md:py-14 lg:py-16",
        )}
        style={containerStyle}
      >
        <nav aria-label="Footer navigation" className="grid" style={gridStyle}>
          {columns.map((section) => (
            <FooterSection
              key={section.key}
              linkClassName={linkClassName}
              linkStyle={linkStyle}
              section={section}
              titleStyle={titleStyle}
              translate={translateWithFallback}
            />
          ))}
        </nav>
        {(statusSlot || themeToggleSlot) && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--footer-text)]">
              {statusSlot}
            </div>
            <div className="flex items-center justify-start gap-4 sm:justify-end">
              {themeToggleSlot}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
