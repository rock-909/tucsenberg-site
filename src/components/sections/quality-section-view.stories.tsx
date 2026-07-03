import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryQuality,
  homepageStoryQualityZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  QualitySectionView,
  type QualitySectionContent,
} from "@/components/sections/quality-section-view";

const homepageStoryQualityLongCopy = {
  ...homepageStoryQuality,
  title:
    "Starter commitments for content replacement, proof review, inquiry safety, and launch readiness",
  commitments: homepageStoryQuality.commitments.map((commitment, index) => ({
    ...commitment,
    title:
      index === 0
        ? "Clear response window for long, multi-step inquiry review workflows"
        : commitment.title,
    description:
      index === 0
        ? "State the real response time, review path, evidence requirements, and follow-up expectations visitors can rely on after submitting a detailed inquiry."
        : commitment.description,
  })),
} satisfies QualitySectionContent;

const meta = {
  title: "Sections/QualitySectionView",
  component: QualitySectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: homepageStoryQuality,
  },
} satisfies Meta<typeof QualitySectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: homepageStoryQualityLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    content: homepageStoryQualityZh,
  },
};

export const NarrowCanvas: Story = {
  args: {
    content: homepageStoryQualityLongCopy,
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
