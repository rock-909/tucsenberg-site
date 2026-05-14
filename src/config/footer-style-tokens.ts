/**
 * Footer 视觉 token：独立文件，避免 footer-links.ts 体积超过 max-lines 限制。
 */
export const FOOTER_STYLE_TOKENS = {
  layout: {
    maxWidthPx: 1080,
    marginXClamp: "clamp(24px, 12vw, 184px)",
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
    fontFamily:
      "var(--font-geist-sans), var(--font-chinese-stack), system-ui, -apple-system, sans-serif",
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
    selection: {
      dark: {
        background: "var(--footer-selection-dark-background)",
        foreground: "var(--footer-selection-dark-foreground)",
      },
      light: {
        background: "var(--footer-selection-light-background)",
        foreground: "var(--footer-selection-light-foreground)",
      },
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
