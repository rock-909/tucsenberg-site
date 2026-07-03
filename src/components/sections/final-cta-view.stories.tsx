import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryFinalCta,
  homepageStoryFinalCtaZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  FinalCTAView,
  type FinalCtaContent,
} from "@/components/sections/final-cta-view";

const homepageStoryFinalCtaLongCopy = {
  ...homepageStoryFinalCta,
  title:
    "Ready to adapt this starter into a real website with clearer proof, sharper offers, and a lower-friction inquiry path?",
  description:
    "Use this long-copy story to check whether the final conversion section keeps the headline, supporting copy, action buttons, and trust strip readable when a real project needs fuller context.",
} satisfies FinalCtaContent;

const meta = {
  title: "Sections/FinalCTAView",
  component: FinalCTAView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: homepageStoryFinalCta,
  },
} satisfies Meta<typeof FinalCTAView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: homepageStoryFinalCtaLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    content: homepageStoryFinalCtaZh,
  },
};

export const NarrowCanvas: Story = {
  args: {
    content: homepageStoryFinalCtaLongCopy,
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
