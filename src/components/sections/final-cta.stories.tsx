import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  homepageStoryFinalCta,
  homepageStoryFinalCtaZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  FinalCTAView,
  type FinalCtaContent,
} from "@/components/sections/final-cta-view";

const homepageStoryFinalCtaLongCopy = {
  ...homepageStoryFinalCta,
  title:
    "Ready to adapt this starter into a real website with clearer proof, sharper offers, and a lower-friction inquiry path?",
  description:
    "Use this long-copy story to check whether the final conversion section keeps the headline, supporting copy, action buttons, and trust strip readable when a real project needs fuller context.",
} satisfies FinalCtaContent;

const homepageStoryFinalCtaLongChineseCopy = {
  ...homepageStoryFinalCtaZh,
  title:
    "准备把这套模板替换成一个真正能承接产品、服务、证明材料和询盘转化的网站了吗？",
  description:
    "这个场景用更长的中文标题和说明来检查最终行动区块，确认标题、说明、按钮和信任信息在真实项目文案变长后仍然清楚稳定。",
} satisfies FinalCtaContent;

const meta = {
  title: "Sections/FinalCTA",
  component: FinalCTAView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    content: homepageStoryFinalCta,
  },
} satisfies Meta<typeof FinalCTAView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    content: homepageStoryFinalCtaLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    content: homepageStoryFinalCtaZh,
  },
};

export const LongChineseCopy: Story = {
  args: {
    content: homepageStoryFinalCtaLongChineseCopy,
  },
};
