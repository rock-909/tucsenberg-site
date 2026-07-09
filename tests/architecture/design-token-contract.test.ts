import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FOOTER_STYLE_TOKENS } from "@/config/footer-style-tokens";

const GLOBALS_CSS = "src/app/globals.css";
const FOOTER_LAYOUT_SOURCE = "src/app/[locale]/layout.tsx";
const FOOTER_COMPONENT_SOURCE = "src/components/footer/Footer.tsx";
const FOOTER_STYLE_TOKEN_SOURCE = "src/config/footer-style-tokens.ts";

const RAW_COLOR_PRODUCTION_FILES = [
  "src/components/ui/button.tsx",
  "src/components/forms/contact-form-feedback.tsx",
  "src/components/forms/contact-form-container.tsx",
  "src/components/security/turnstile.tsx",
  FOOTER_COMPONENT_SOURCE,
] as const;

const REQUIRED_BRAND_STEPS = Array.from(
  { length: 12 },
  (_, index) => `--brand-${index + 1}`,
);

const REQUIRED_NEUTRAL_STEPS = Array.from(
  { length: 12 },
  (_, index) => `--neutral-${index + 1}`,
);

const REQUIRED_STATUS_TOKENS = [
  "--success-muted",
  "--success-border",
  "--success-foreground",
  "--warning-muted",
  "--warning-border",
  "--warning-foreground",
  "--error-muted",
  "--error-border",
  "--error-foreground",
  "--info-muted",
  "--info-border",
  "--info-foreground",
] as const;

const SEMANTIC_TOKEN_EXPECTATIONS = {
  "--background": "var(--neutral-1)",
  "--foreground": "var(--neutral-12)",
  "--card": "var(--neutral-2)",
  "--card-foreground": "var(--neutral-12)",
  "--popover": "var(--neutral-1)",
  "--popover-foreground": "var(--neutral-12)",
  "--primary": "var(--brand-9)",
  "--primary-foreground": "var(--neutral-1)",
  "--primary-dark": "var(--brand-10)",
  "--primary-light": "var(--brand-2)",
  "--primary-50": "var(--brand-1)",
  "--accent": "var(--brand-2)",
  "--accent-foreground": "var(--brand-9)",
  "--muted": "var(--neutral-3)",
  "--muted-foreground": "var(--neutral-12)",
  "--border": "var(--neutral-5)",
  "--border-light": "var(--neutral-4)",
  "--ring": "var(--brand-7)",
  "--success-light": "var(--success-muted)",
} as const;

const THEME_COLOR_BINDING_EXPECTATIONS = {
  "--color-primary": "var(--primary)",
  "--color-primary-foreground": "var(--primary-foreground)",
  "--color-destructive": "var(--destructive)",
  "--color-destructive-foreground": "var(--destructive-foreground)",
  "--color-muted-foreground": "var(--muted-foreground)",
  "--color-secondary-foreground": "var(--secondary-foreground)",
  "--color-accent-foreground": "var(--accent-foreground)",
} as const;

const BANNED_RAW_BRAND_PALETTE_CLASS_PATTERN =
  /\b(?:bg|text|border|ring|outline)-(?:sky|cyan)-\d{2,3}\b/;

const BANNED_RAW_STATUS_PALETTE_CLASS_PATTERN =
  /\b(?:bg|text|border|ring|outline)-(?:green|red|amber|yellow|emerald)-\d{2,3}\b/;

const BANNED_RAW_INFO_PALETTE_CLASS_PATTERN =
  /\b(?:bg|text|border|ring|outline)-(?:blue|sky|cyan)-\d{2,3}\b/;

const BANNED_INLINE_BRAND_PATTERN =
  /#004d9e|#003b7a|rgba\(\s*0\s*,\s*77\s*,\s*158\b/i;

const BANNED_FOOTER_RAW_PALETTE_CLASS_PATTERN =
  /\b(?:(?:hover|dark|focus-visible):)*(?:bg|text|border|ring|outline)-(?:neutral|gray|slate|zinc|stone|blue|sky|cyan|green|red|amber|yellow|emerald)-\d{2,3}\b/;

const FOOTER_SURFACE_TOKEN_EXPECTATIONS = {
  "--footer-bg": "var(--neutral-1)",
  "--footer-text": "var(--neutral-10)",
  "--footer-heading": "var(--neutral-11)",
  "--footer-link": "var(--neutral-9)",
  "--footer-divider": "color-mix(in oklch, var(--neutral-12) 10%, transparent)",
} as const;

const FOOTER_STYLE_TOKEN_TAILWIND_SOURCE =
  '@source "../config/footer-style-tokens.ts";';

function readRepoFile(filePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo files
  if (!existsSync(filePath)) {
    throw new Error(`Missing expected file: ${filePath}`);
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo files
  return readFileSync(filePath, "utf8");
}

function stripCssComments(source: string) {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

function extractHighContrastBlocks(css: string) {
  const marker = "@media (prefers-contrast: high)";
  const blocks: string[] = [];
  let searchStartIndex = 0;

  while (searchStartIndex < css.length) {
    const startIndex = css.indexOf(marker, searchStartIndex);

    if (startIndex === -1) {
      break;
    }

    const blockStart = css.indexOf("{", startIndex);

    if (blockStart === -1) {
      break;
    }

    let depth = 0;

    for (let index = blockStart; index < css.length; index += 1) {
      const character = css[index];

      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;

        if (depth === 0) {
          blocks.push(css.slice(startIndex, index + 1));
          searchStartIndex = index + 1;
          break;
        }
      }
    }
  }

  return blocks;
}

function findHighContrastOverrideBlock(blocks: readonly string[]) {
  return (
    blocks.find(
      (block) =>
        block.includes("--ring") ||
        block.includes("*:focus-visible") ||
        block.includes('button, [role="button"]'),
    ) ?? null
  );
}

function readCssVariable(css: string, tokenName: string) {
  const escapedTokenName = tokenName.replaceAll("-", "\\-");
  // eslint-disable-next-line security/detect-non-literal-regexp -- token names are fixed test inputs for contract assertions
  const pattern = new RegExp(`${escapedTokenName}\\s*:\\s*([^;]+);`);
  const match = css.match(pattern);

  return match?.[1]?.trim();
}

describe("design token contract", () => {
  it("defines a 12-step brand and neutral primitive scale", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    for (const token of [...REQUIRED_BRAND_STEPS, ...REQUIRED_NEUTRAL_STEPS]) {
      expect(
        readCssVariable(css, token),
        `${token} should exist in ${GLOBALS_CSS}`,
      ).toBeDefined();
    }
  });

  it("maps semantic UI roles to primitive token roles", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    for (const [token, expectedValue] of Object.entries(
      SEMANTIC_TOKEN_EXPECTATIONS,
    )) {
      expect(readCssVariable(css, token), token).toBe(expectedValue);
    }
  });

  it("defines status state aliases for forms and system feedback", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    for (const token of REQUIRED_STATUS_TOKENS) {
      expect(
        readCssVariable(css, token),
        `${token} should exist in ${GLOBALS_CSS}`,
      ).toBeDefined();
    }
  });

  it("binds semantic color roles used by Tailwind utilities", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    for (const [token, expectedValue] of Object.entries(
      THEME_COLOR_BINDING_EXPECTATIONS,
    )) {
      expect(readCssVariable(css, token), token).toBe(expectedValue);
    }
  });

  it("keeps footer browser UI config in a semantic light/dark link contract", () => {
    const footerTokenSource = stripCssComments(
      readRepoFile(FOOTER_STYLE_TOKEN_SOURCE),
    );

    expect(footerTokenSource).toContain('text: "text-[var(--footer-text)]"');
    expect(footerTokenSource).toContain(
      'hoverText: "hover:text-[var(--footer-link)]"',
    );
    expect(footerTokenSource).not.toContain('text: ""');
    expect(footerTokenSource).not.toContain('hoverText: ""');
  });

  it("keeps footer surface roles wired through footer-specific tokens", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));
    const footerLayoutSource = stripCssComments(
      readRepoFile(FOOTER_LAYOUT_SOURCE),
    );
    const footerComponentSource = stripCssComments(
      readRepoFile(FOOTER_COMPONENT_SOURCE),
    );

    for (const [token, expectedValue] of Object.entries(
      FOOTER_SURFACE_TOKEN_EXPECTATIONS,
    )) {
      expect(readCssVariable(css, token), token).toBe(expectedValue);
    }

    expect(footerComponentSource).toContain("bg-[var(--footer-bg)]");
    expect(footerComponentSource).toContain("text-[var(--footer-text)]");
    expect(footerComponentSource).toContain("border-[var(--footer-divider)]");
    expect(footerComponentSource).toContain("text-[var(--footer-heading)]");
    expect(footerComponentSource).not.toContain("bg-background");
    expect(footerComponentSource).not.toContain("text-foreground");
    // The legal identity bar is rendered inside Footer itself; layout must not
    // reintroduce footer-styled text outside the footer token contract.
    expect(footerLayoutSource).not.toContain("text-[var(--footer-");
  });

  it("keeps runtime font truth aligned across design docs and footer tokens", () => {
    const globals = readRepoFile(GLOBALS_CSS);
    const design = readRepoFile("DESIGN.md");
    const truth = readRepoFile("docs/design/设计真相.md");
    const footerTokens = readRepoFile(FOOTER_STYLE_TOKEN_SOURCE);

    expect(globals).toContain("--font-sans");
    expect(design).toContain("system stack");
    expect(truth).toContain("system stack");
    expect(FOOTER_STYLE_TOKENS.typography.fontFamily).toBe(
      "var(--font-sans), var(--font-chinese)",
    );
    expect(footerTokens).not.toContain("Geist");
    expect(truth).not.toContain("Figtree");
  });

  it("keeps selected production UI files off raw brand palette classes", () => {
    for (const filePath of RAW_COLOR_PRODUCTION_FILES) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.match(BANNED_RAW_BRAND_PALETTE_CLASS_PATTERN),
        `${filePath} should route brand color usage through --primary or other brand semantic tokens instead of raw Tailwind sky/cyan palette classes`,
      ).toBeNull();
    }
  });

  it("keeps selected production UI files off raw status palette classes", () => {
    for (const filePath of RAW_COLOR_PRODUCTION_FILES) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.match(BANNED_RAW_STATUS_PALETTE_CLASS_PATTERN),
        `${filePath} should route success/warning/error states through semantic status tokens instead of raw Tailwind green/red/amber/yellow/emerald palette classes`,
      ).toBeNull();
    }
  });

  it("keeps selected production UI files off raw info palette classes", () => {
    for (const filePath of RAW_COLOR_PRODUCTION_FILES) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.match(BANNED_RAW_INFO_PALETTE_CLASS_PATTERN),
        `${filePath} should route info or submitting states through --info-* semantic tokens instead of raw Tailwind blue/sky/cyan palette classes`,
      ).toBeNull();
    }
  });

  it("keeps selected production UI files from embedding old brand color values", () => {
    for (const filePath of RAW_COLOR_PRODUCTION_FILES) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.match(BANNED_INLINE_BRAND_PATTERN),
        `${filePath} should not embed the old steel-blue value directly`,
      ).toBeNull();
    }
  });

  it("keeps footer browser UI config off raw Tailwind palette classes", () => {
    const footerSources = [FOOTER_STYLE_TOKEN_SOURCE, FOOTER_COMPONENT_SOURCE];

    for (const filePath of footerSources) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.match(BANNED_FOOTER_RAW_PALETTE_CLASS_PATTERN),
        `${filePath} should use semantic tokens instead of raw Tailwind palette classes because it feeds browser-rendered footer UI`,
      ).toBeNull();
    }
  });

  it("includes footer browser UI config in Tailwind source scanning", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    expect(css).toContain(FOOTER_STYLE_TOKEN_TAILWIND_SOURCE);
  });

  it("does not keep old brand color values in the browser runtime CSS", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    expect(
      css.match(BANNED_INLINE_BRAND_PATTERN),
      `${GLOBALS_CSS} should not keep old brand hex or rgba values, including high-contrast overrides`,
    ).toBeNull();
  });

  it("keeps high contrast overrides off old brand values", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));
    const highContrastBlocks = extractHighContrastBlocks(css);
    const highContrastOverrideBlock =
      findHighContrastOverrideBlock(highContrastBlocks);

    expect(
      highContrastBlocks.length,
      `${GLOBALS_CSS} should define at least one @media (prefers-contrast: high) block`,
    ).toBeGreaterThan(0);

    expect(
      highContrastOverrideBlock,
      `${GLOBALS_CSS} should include a high contrast override block for --ring or focus-visible states`,
    ).toBeTruthy();

    for (const block of highContrastBlocks) {
      expect(
        block.match(BANNED_INLINE_BRAND_PATTERN),
        `${GLOBALS_CSS} high contrast blocks should not keep old brand hex or rgba values`,
      ).toBeNull();
    }
  });

  it("keeps the runtime Button pilot intentionally scoped", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));

    expect(readCssVariable(css, "--font-sans")).toContain("-apple-system");
    expect(readCssVariable(css, "--font-sans")).toContain("BlinkMacSystemFont");
    expect(readCssVariable(css, "--font-sans")).toContain("Segoe UI");
    expect(css).not.toContain("next/font");
    expect(css).not.toContain("Geist");

    expect(readCssVariable(css, "--button-radius")).toBe("0.75rem");
    expect(readCssVariable(css, "--button-height-default")).toBe("2.5rem");
    expect(readCssVariable(css, "--button-height-sm")).toBe("2rem");
    expect(readCssVariable(css, "--button-height-lg")).toBe("3rem");

    // Positive assertions: prove Card/Input radius stay on their current
    // baseline aliases (not merely "not the pilot value"), so any real
    // migration of these tokens fails the Button-only pilot contract.
    expect(readCssVariable(css, "--radius")).toBe("1.3rem");
    expect(readCssVariable(css, "--card-radius")).toBe("var(--radius-lg)");
    expect(readCssVariable(css, "--input-radius")).toBe("var(--radius-md)");
    expect(readCssVariable(css, "--section-radius")).toBeUndefined();

    const truth = readRepoFile("docs/design/设计真相.md");
    const uiComponents = readRepoFile("docs/design/组件使用手册.md");

    expect(truth).toContain("Runtime Button pilot");
    expect(truth).toContain("Card, Input, or section radius migration");
    expect(uiComponents).toContain("Runtime Button pilot boundary");
    expect(uiComponents).toContain("--button-height-default");
  });
});
