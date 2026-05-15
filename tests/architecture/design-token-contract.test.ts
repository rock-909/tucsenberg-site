import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const GLOBALS_CSS = "src/app/globals.css";
const FOOTER_LAYOUT_SOURCE = "src/app/[locale]/layout.tsx";
const FOOTER_COMPONENT_SOURCE = "src/components/footer/Footer.tsx";
const FOOTER_STYLE_TOKEN_SOURCE = "src/config/footer-style-tokens.ts";

const RAW_COLOR_PRODUCTION_FILES = [
  "src/components/ui/button.tsx",
  "src/components/forms/contact-form-feedback.tsx",
  "src/components/forms/contact-form-container.tsx",
  "src/components/security/turnstile.tsx",
  "src/app/[locale]/page.tsx",
  "src/components/search/home-hero-search.tsx",
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
  "--background": "var(--color-surface-canvas)",
  "--foreground": "var(--color-text-primary)",
  "--card": "var(--color-surface-elevated)",
  "--card-foreground": "var(--color-text-primary)",
  "--popover": "var(--color-surface-elevated)",
  "--popover-foreground": "var(--color-text-primary)",
  "--primary": "var(--color-brand-primary)",
  "--primary-foreground": "var(--color-surface-elevated)",
  "--primary-dark":
    "color-mix(in oklch, var(--color-brand-primary) 82%, black)",
  "--primary-light": "var(--color-surface-muted)",
  "--primary-50": "var(--color-surface-muted)",
  "--accent": "var(--color-surface-muted)",
  "--accent-foreground": "var(--color-brand-primary)",
  "--muted": "var(--neutral-3)",
  "--muted-foreground": "var(--color-text-muted)",
  "--border": "var(--color-border-default)",
  "--border-light": "var(--color-surface-muted)",
  "--ring": "var(--color-brand-accent)",
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

const REQUIRED_FOOTER_SELECTION_TOKENS = [
  "--footer-selection-light-background",
  "--footer-selection-light-foreground",
  "--footer-selection-dark-background",
  "--footer-selection-dark-foreground",
] as const;

const FOOTER_SELECTION_TOKEN_EXPECTATIONS = {
  "--footer-selection-light-background": "var(--neutral-3)",
  "--footer-selection-light-foreground": "var(--neutral-12)",
  "--footer-selection-dark-background": "var(--neutral-3)",
  "--footer-selection-dark-foreground": "var(--neutral-12)",
} as const;

const FOOTER_SELECTION_RUNTIME_CHAIN = {
  "--footer-selection-dark-bg": "--footer-selection-dark-background",
  "--footer-selection-dark-fg": "--footer-selection-dark-foreground",
  "--footer-selection-light-bg": "--footer-selection-light-background",
  "--footer-selection-light-fg": "--footer-selection-light-foreground",
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
  "--footer-bg": "var(--neutral-11)",
  "--footer-text": "var(--neutral-5)",
  "--footer-heading": "var(--neutral-6)",
  "--footer-link": "var(--neutral-4)",
  "--footer-divider": "color-mix(in oklch, var(--neutral-1) 8%, transparent)",
} as const;

const FOOTER_STYLE_TOKEN_TAILWIND_SOURCE =
  '@source "../config/footer-style-tokens.ts";';

// Step-4 flagship page sources whose teal accents regressed when they
// referenced an undefined `--brand-teal` custom property. This guardrail keeps
// every `var(--…)` they reference resolvable to a token defined in globals.css.
const STEP_4_TOKEN_CONSUMER_FILES = [
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/compatible/[brand]/brand-compatibility-filter.tsx",
  "src/app/[locale]/membranes/[product]/compatibility-section.tsx",
  "src/components/search/home-hero-search.tsx",
] as const;

function collectVarReferences(source: string) {
  const references = new Set<string>();
  const pattern = /var\(\s*(--[a-zA-Z0-9-]+)\s*[),]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const token = match[1];
    if (token) {
      references.add(token);
    }
  }

  return references;
}

function collectDefinedCustomProperties(css: string) {
  const definitions = new Set<string>();
  const pattern = /(--[a-zA-Z0-9-]+)\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(css)) !== null) {
    const token = match[1];
    if (token) {
      definitions.add(token);
    }
  }

  return definitions;
}

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

  it("defines footer-specific selection tokens for light and dark states", () => {
    const css = stripCssComments(readRepoFile(GLOBALS_CSS));
    const footerTokenSource = stripCssComments(
      readRepoFile(FOOTER_STYLE_TOKEN_SOURCE),
    );

    for (const token of REQUIRED_FOOTER_SELECTION_TOKENS) {
      expect(
        readCssVariable(css, token),
        `${token} should exist in ${GLOBALS_CSS}`,
      ).toBeDefined();
      expect(
        footerTokenSource.includes(`var(${token})`),
        `${FOOTER_STYLE_TOKEN_SOURCE} should consume ${token}`,
      ).toBe(true);
    }

    for (const [token, expectedValue] of Object.entries(
      FOOTER_SELECTION_TOKEN_EXPECTATIONS,
    )) {
      expect(readCssVariable(css, token), token).toBe(expectedValue);
    }
  });

  it("wires footer selection tokens through the rendered footer component", () => {
    const footerTokenSource = stripCssComments(
      readRepoFile(FOOTER_STYLE_TOKEN_SOURCE),
    );
    const footerComponentSource = stripCssComments(
      readRepoFile(FOOTER_COMPONENT_SOURCE),
    );

    for (const [runtimeToken, sourceToken] of Object.entries(
      FOOTER_SELECTION_RUNTIME_CHAIN,
    )) {
      expect(
        footerTokenSource.includes(`var(${sourceToken})`),
        `${FOOTER_STYLE_TOKEN_SOURCE} should source ${runtimeToken} from ${sourceToken}`,
      ).toBe(true);
      expect(
        footerComponentSource.includes(`"${runtimeToken}"`),
        `${FOOTER_COMPONENT_SOURCE} should expose ${runtimeToken} as an inline custom property`,
      ).toBe(true);
      expect(
        footerComponentSource.includes(`var(${runtimeToken})`),
        `${FOOTER_COMPONENT_SOURCE} should consume ${runtimeToken} in selection utilities`,
      ).toBe(true);
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
    expect(footerLayoutSource).toContain("text-[var(--footer-text)]");
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

  it("resolves every var(--…) referenced by Step-4 pages to a defined custom property", () => {
    const definedTokens = collectDefinedCustomProperties(
      stripCssComments(readRepoFile(GLOBALS_CSS)),
    );

    for (const filePath of STEP_4_TOKEN_CONSUMER_FILES) {
      const source = stripCssComments(readRepoFile(filePath));

      expect(
        source.includes("var(--brand-teal)"),
        `${filePath} must not reference the undefined --brand-teal token (use --color-brand-accent)`,
      ).toBe(false);

      for (const token of collectVarReferences(source)) {
        expect(
          definedTokens.has(token),
          `${filePath} references var(${token}) but ${GLOBALS_CSS} does not define ${token}`,
        ).toBe(true);
      }
    }
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
});
