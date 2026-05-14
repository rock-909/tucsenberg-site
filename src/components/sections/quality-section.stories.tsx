import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
  standards: homepageStoryQuality.standards.map((standard, index) => ({
    ...standard,
    label:
      index === 0
        ? "Content, visual, governance, and replacement checklist reviewed"
        : standard.label,
  })),
  proofItems: homepageStoryQuality.proofItems.map((proofItem, index) => ({
    ...proofItem,
    label:
      index === 0 ? "Long example checks for layout review" : proofItem.label,
  })),
} satisfies QualitySectionContent;

const homepageStoryQualityLongChineseCopy = {
  ...homepageStoryQualityZh,
  title: "用于检查中文长标题、长说明和证明信息是否稳定展示的质量承诺区块",
  subtitle:
    "这个场景模拟真实项目上线前常见的长中文说明，检查承诺卡片、证明信息、标准标签和底部证明条在文案变长后是否仍然清楚、稳定、容易阅读。",
  commitments: homepageStoryQualityZh.commitments.map((commitment, index) => ({
    ...commitment,
    title:
      index === 0
        ? "覆盖复杂询盘流程、资料确认和后续跟进的清晰响应时间"
        : commitment.title,
    description:
      index === 0
        ? "说明访客提交详细询盘之后，可以期待怎样的真实回复时间、资料确认方式、证据核验过程和后续沟通安排。"
        : commitment.description,
  })),
  standards: homepageStoryQualityZh.standards.map((standard, index) => ({
    ...standard,
    label:
      index === 0
        ? "内容、视觉系统、治理规则和上线替换清单已经完成审查"
        : standard.label,
  })),
  proofItems: homepageStoryQualityZh.proofItems.map((proofItem, index) => ({
    ...proofItem,
    label: index === 0 ? "用于版面压力检查的较长示例检查项" : proofItem.label,
  })),
} satisfies QualitySectionContent;

const meta = {
  title: "Sections/QualitySection",
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

export const LongChineseCopy: Story = {
  args: {
    content: homepageStoryQualityLongChineseCopy,
  },
};
