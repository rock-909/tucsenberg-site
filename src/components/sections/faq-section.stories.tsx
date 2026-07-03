import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FaqSectionView } from "@/components/sections/faq-section-view";
import {
  sectionStoryFaqChineseItems,
  sectionStoryFaqItems,
  sectionStoryFaqLongItems,
} from "@/components/sections/section-story-fixtures";

const meta = {
  title: "Sections/FaqSection",
  component: FaqSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Frequently asked starter questions",
    subtitle: "Use this section to answer replacement and launch questions.",
    items: sectionStoryFaqItems,
  },
} satisfies Meta<typeof FaqSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongAnswers: Story = {
  args: {
    title:
      "Frequently asked questions about starter replacement, proof review, and launch readiness",
    items: sectionStoryFaqLongItems,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "常见问题",
    subtitle: "回答模板替换、证明材料和上线准备相关问题。",
    items: sectionStoryFaqChineseItems,
  },
};

export const WithoutJsonLd: Story = {};
