import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeConfirmSectionView } from "@/components/sections/home-confirm-section-view";
import {
  sectionStoryHomeConfirm,
  sectionStoryHomeConfirmChinese,
} from "@/components/sections/section-story-fixtures";

const meta = {
  title: "Sections/HomeConfirmSectionView",
  component: HomeConfirmSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: sectionStoryHomeConfirm,
} satisfies Meta<typeof HomeConfirmSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChineseCopy: Story = {
  args: sectionStoryHomeConfirmChinese,
};
