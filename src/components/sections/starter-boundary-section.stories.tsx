import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StarterBoundarySectionView } from "@/components/sections/starter-boundary-section-view";
import {
  sectionStoryStarterBoundary,
  sectionStoryStarterBoundaryZh,
} from "@/components/sections/section-story-fixtures";

const sectionStoryStarterBoundaryLongCopy = {
  ...sectionStoryStarterBoundary,
  title:
    "This polished website starter still needs verified content, proof, routes, and launch ownership before it becomes a real public site",
  description:
    "Use this long-copy story to check whether the boundary reminder remains readable when the project needs more explicit instructions for replacement, verification, approval, and public launch.",
};

const meta = {
  title: "Sections/StarterBoundarySection",
  component: StarterBoundarySectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: sectionStoryStarterBoundary,
  },
} satisfies Meta<typeof StarterBoundarySectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: sectionStoryStarterBoundaryLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    content: sectionStoryStarterBoundaryZh,
  },
};
