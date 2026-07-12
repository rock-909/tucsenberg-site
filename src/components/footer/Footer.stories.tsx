import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Footer } from "@/components/footer/Footer";
import type { FooterColumnConfig } from "@/config/footer-links";

const customColumns = [
  {
    key: "starter",
    title: "Starter",
    translationKey: "storybook.footer.starter",
    links: [
      {
        key: "overview",
        label: "Overview",
        href: "/products",
        translationKey: "storybook.footer.overview",
      },
      {
        key: "workflow",
        label: "How it works",
        href: "/how-it-works",
        translationKey: "storybook.footer.workflow",
      },
    ],
  },
  {
    key: "support",
    title: "Support",
    translationKey: "storybook.footer.support",
    links: [
      {
        key: "contact",
        label: "Contact",
        href: "/contact",
        translationKey: "storybook.footer.contact",
      },
      {
        key: "privacy",
        label: "Privacy",
        href: "/privacy",
        translationKey: "storybook.footer.privacy",
      },
    ],
  },
] satisfies FooterColumnConfig[];

const longLinkColumns = [
  {
    key: "long-resources",
    title: "Long starter resources",
    translationKey: "storybook.footer.longResources",
    links: [
      {
        key: "replacement-checklist",
        label: "Website starter replacement checklist for project owners",
        href: "/how-it-works",
        translationKey: "storybook.footer.replacementChecklist",
      },
      {
        key: "storybook",
        label: "Component governance and visual review workflow",
        href: "/products",
        translationKey: "storybook.footer.storybook",
      },
    ],
  },
  {
    key: "long-contact",
    title: "Contact and proof",
    translationKey: "storybook.footer.longContact",
    links: [
      {
        key: "inquiry",
        label: "Start a detailed project inquiry with context",
        href: "/contact",
        translationKey: "storybook.footer.inquiry",
      },
    ],
  },
] satisfies FooterColumnConfig[];

const meta = {
  title: "Footer/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithThemeToggleSlot: Story = {
  args: {
    themeToggleSlot: (
      <button
        className="rounded-md border border-border px-3 py-1 text-sm"
        type="button"
      >
        Theme control slot
      </button>
    ),
  },
};

export const CustomColumns: Story = {
  args: {
    columns: customColumns,
  },
};

export const LongLinks: Story = {
  args: {
    columns: longLinkColumns,
  },
};

export const DarkSurface: Story = {
  args: {
    dataTheme: "dark",
  },
  parameters: {
    backgrounds: { default: "Dark" },
  },
};
