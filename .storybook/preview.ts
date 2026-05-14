import type { Preview } from "@storybook/nextjs-vite";
// Storybook config lives outside src/, and Vite does not resolve the app alias
// early enough for the global CSS import during preview builds.
// eslint-disable-next-line no-restricted-imports -- Storybook preview is outside src and needs this CSS import before app alias resolution.
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "Canvas",
      options: {
        Canvas: { name: "Canvas", value: "var(--background)" },
        Muted: { name: "Muted", value: "var(--muted)" },
        Dark: { name: "Dark", value: "var(--neutral-11)" },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
};

export default preview;
