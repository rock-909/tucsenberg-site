import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryHero,
  homepageStoryHeroCjkTypography,
  homepageStoryHeroLongCopy,
} from "@/components/sections/hero-section-view.fixtures";
import { HeroSectionView } from "@/components/sections/hero-section-view";

const meta = {
  title: "Sections/HeroSectionView",
  component: HeroSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: homepageStoryHero,
  },
} satisfies Meta<typeof HeroSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: homepageStoryHeroLongCopy,
  },
};

// 中日韩字形是等宽全角、几乎没有词间空格，折行点跟英文完全不同。这条守的是
// 排版，不是语言支持；站点只出英文。
export const LongChineseContent: Story = {
  args: {
    content: homepageStoryHeroCjkTypography,
  },
};

export const NarrowCanvas: Story = {
  args: {
    content: homepageStoryHeroLongCopy,
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
