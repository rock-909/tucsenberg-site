import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryHero,
  homepageStoryHeroLongCopy,
  homepageStoryHeroZh,
} from "@/components/sections/homepage-section.fixtures";
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

export const ChineseCopy: Story = {
  args: {
    content: homepageStoryHeroZh,
  },
  globals: {
    locale: "en",
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
