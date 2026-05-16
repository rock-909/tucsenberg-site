import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NarrativeSection } from "@/components/trust/narrative-section";

const meta = {
  title: "Trust/NarrativeSection",
  component: NarrativeSection,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Why part-number matching comes before everything else",
    body: "Tucsenberg starts from the OEM model and part number you already run, not from a generic catalog.",
  },
} satisfies Meta<typeof NarrativeSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEyebrowAndCta: Story = {
  args: {
    eyebrow: "Compatibility first",
    cta: { label: "Find my part", href: "/compatible" },
  },
};

export const NoDivider: Story = {
  args: {
    divider: false,
  },
};
