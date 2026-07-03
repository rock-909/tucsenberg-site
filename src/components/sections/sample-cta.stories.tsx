import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import { SampleCTAView } from "@/components/sections/sample-cta-view";
import {
  sectionStorySampleCta,
  sectionStorySampleCtaZh,
} from "@/components/sections/section-story-fixtures";

const sectionStorySampleCtaLongCopy = {
  ...sectionStorySampleCta,
  title:
    "Ready to replace this starter with real product, service, proof, and inquiry content?",
  description:
    "This long-copy CTA story checks whether the conversion block keeps the headline, supporting explanation, decorative frame, and action button stable.",
};

const meta = {
  title: "Sections/SampleCTA",
  component: SampleCTAView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: sectionStorySampleCta,
  },
} satisfies Meta<typeof SampleCTAView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: sectionStorySampleCtaLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    content: sectionStorySampleCtaZh,
  },
};

export const NarrowCanvas: Story = {
  args: {
    content: sectionStorySampleCtaLongCopy,
  },
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
  parameters: {
    viewport: {
      options: MINIMAL_VIEWPORTS,
    },
  },
};
