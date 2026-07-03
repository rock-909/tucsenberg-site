import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import { ChainSectionView } from "@/components/sections/chain-section-view";
import {
  sectionStoryChain,
  sectionStoryChainSteps,
} from "@/components/sections/section-story-fixtures";

const longSteps = sectionStoryChainSteps.map((step, index) => ({
  ...step,
  title:
    index === 0
      ? "Long review step title for replacement and launch readiness"
      : step.title,
  desc:
    index === 0
      ? "This longer step description checks wrapping and connector spacing when real process copy explains replacement, evidence review, and approval responsibilities."
      : step.desc,
}));

const meta = {
  title: "Sections/ChainSection",
  component: ChainSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: sectionStoryChain,
} satisfies Meta<typeof ChainSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    title:
      "A longer starter process chain for content replacement, proof review, inquiry readiness, and launch approval",
    subtitle:
      "This story checks whether five process steps stay readable when real project workflow copy is longer than the starter baseline.",
    steps: longSteps,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "模板替换流程",
    subtitle: "说明访客或项目负责人如何从内容审查进入询盘和上线准备。",
    steps: sectionStoryChainSteps.map((step, index) => ({
      ...step,
      title: `审查步骤 ${String(index + 1)}`,
      desc: "替换模板内容、核验证明材料，并确认下一步网站状态。",
    })),
    stats: ["内容已映射", "证明已检查", "询盘已就绪"],
  },
};

export const NarrowCanvas: Story = {
  args: {
    steps: longSteps,
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
