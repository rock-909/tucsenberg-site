/**
 * Footer 数据与样式基线。
 *
 * 目标：为后续 Footer 组件提供可复用的数据结构、主题配色/间距/字体 token 与 hover 方案。
 * 采样来源：展示型网站页脚基线（视口 1512px，dark/light 双主题）。
 */
import { FOOTER_STYLE_TOKENS } from "@/config/footer-style-tokens";
import {
  SINGLE_SITE_FOOTER_COLUMNS,
  type SiteFooterColumnConfig,
  type SiteFooterLinkItem,
} from "@/config/single-site";

export { FOOTER_STYLE_TOKENS };

/**
 * @public Footer link item contract for downstream starter customization.
 */
export type FooterLinkItem = SiteFooterLinkItem;
export type FooterColumnConfig = SiteFooterColumnConfig;

interface FooterLayoutTokens {
  /** 容器最大宽度 */
  maxWidthPx: number;
  /** 内容容器使用自动左右边距居中，外层负责响应式内边距 */
  containerMarginInline: string;
  /** 内边距（与现有 layout 的 px-4/6/8 协调） */
  paddingX: {
    basePx: number;
    mdPx: number;
    lgPx: number;
  };
  /** 垂直内边距，用于保持顶部/底部留白一致 */
  paddingY: {
    basePx: number;
    mdPx: number;
    lgPx: number;
  };
  /** 网格间距 */
  gapPx: {
    column: number;
    row: number;
  };
  /** 单列最小宽度，避免窄屏拥挤 */
  minColumnWidthPx: number;
}

interface FooterTypographyTokens {
  title: {
    fontSizePx: number;
    lineHeightPx: number;
    fontWeight: number;
    letterSpacing?: string;
  };
  link: {
    fontSizePx: number;
    lineHeightPx: number;
    fontWeight: number;
  };
  fontFamily: string;
}

interface FooterColorTokens {
  light: {
    text: string;
    hoverText: string;
  };
  dark: {
    text: string;
    hoverText: string;
  };
}

interface FooterHoverTokens {
  description: string;
  transition: string;
  light: {
    text: string;
    underline: boolean;
  };
  dark: {
    text: string;
    underline: boolean;
  };
}

export interface FooterStyleTokens {
  layout: FooterLayoutTokens;
  typography: FooterTypographyTokens;
  colors: FooterColorTokens;
  hover: FooterHoverTokens;
}

// Footer truth is authored in `src/config/single-site.ts`; this module only
// exposes the active single-site columns together with style tokens.
export const FOOTER_COLUMNS = SINGLE_SITE_FOOTER_COLUMNS;

/**
 * @public Footer token surface for downstream layout/theme customization.
 */
export type FooterTokens = typeof FOOTER_STYLE_TOKENS;
