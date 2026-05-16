import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeMembraneTypeSectionView } from "@/components/sections/home-membrane-type-section-view";
import {
  sectionStoryHomeMembraneType,
  sectionStoryHomeMembraneTypeChinese,
} from "@/components/sections/section-story-fixtures";

const meta = {
  title: "Sections/HomeMembraneTypeSectionView",
  component: HomeMembraneTypeSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: sectionStoryHomeMembraneType,
} satisfies Meta<typeof HomeMembraneTypeSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChineseCopy: Story = {
  args: sectionStoryHomeMembraneTypeChinese,
};
