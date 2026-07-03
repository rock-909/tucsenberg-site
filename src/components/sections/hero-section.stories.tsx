import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import {
  homepageStoryHero,
  homepageStoryHeroLongCopy,
  homepageStoryHeroZh,
} from "@/components/sections/homepage-section.fixtures";
import { HeroSectionView } from "@/components/sections/hero-section-view";

const meta = {
  title: "Sections/HeroSection",
  component: HeroSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: homepageStoryHero,
    previewTitleId: "hero-preview-title-default-story",
  },
} satisfies Meta<typeof HeroSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: homepageStoryHeroLongCopy,
    previewTitleId: "hero-preview-title-long-copy-story",
  },
};

export const ChineseCopy: Story = {
  args: {
    content: homepageStoryHeroZh,
    previewTitleId: "hero-preview-title-chinese-copy-story",
  },
  globals: {
    locale: "en",
  },
};

export const NarrowCanvas: Story = {
  args: {
    content: homepageStoryHeroLongCopy,
    previewTitleId: "hero-preview-title-narrow-canvas",
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
