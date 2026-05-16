import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeRisksSectionView } from "@/components/sections/home-risks-section-view";
import {
  sectionStoryHomeRisks,
  sectionStoryHomeRisksChinese,
} from "@/components/sections/section-story-fixtures";

const meta = {
  title: "Sections/HomeRisksSectionView",
  component: HomeRisksSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: sectionStoryHomeRisks,
} satisfies Meta<typeof HomeRisksSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChineseCopy: Story = {
  args: sectionStoryHomeRisksChinese,
};
