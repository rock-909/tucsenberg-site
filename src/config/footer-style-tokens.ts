/**
 * Footer 视觉 token：独立文件，避免 footer-links.ts 体积超过 max-lines 限制。
 */
export const FOOTER_STYLE_TOKENS = {
  layout: {
    maxWidthPx: 1080,
    containerMarginInline: "auto",
    paddingX: {
      basePx: 16,
      mdPx: 24,
      lgPx: 32,
    },
    paddingY: {
      basePx: 48,
      mdPx: 56,
      lgPx: 64,
    },
    gapPx: {
      column: 24,
      row: 24,
    },
    minColumnWidthPx: 176,
  },
  typography: {
    title: {
      fontSizePx: 14,
      lineHeightPx: 20,
      fontWeight: 500,
      letterSpacing: "0px",
    },
    link: {
      fontSizePx: 14,
      lineHeightPx: 20,
      fontWeight: 400,
    },
    fontFamily: "var(--font-sans), var(--font-chinese)",
  },
  colors: {
    light: {
      text: "text-[var(--footer-text)]",
      hoverText: "hover:text-[var(--footer-link)]",
    },
    dark: {
      text: "text-[var(--footer-text)]",
      hoverText: "hover:text-[var(--footer-link)]",
    },
  },
  hover: {
    description:
      "提升文字亮度或轻度下划线，使用 90-100ms color/background 过渡。",
    transition: "transition-colors duration-100 ease",
    light: {
      text: "foreground",
      underline: false,
    },
    dark: {
      text: "foreground",
      underline: false,
    },
  },
};
