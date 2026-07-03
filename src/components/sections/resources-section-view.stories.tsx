import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ResourcesSectionView } from "@/components/sections/resources-section-view";
import { sectionStoryResources } from "@/components/sections/section-story-fixtures";

const longResources = sectionStoryResources.map((resource, index) => ({
  ...resource,
  title:
    index === 0
      ? "Long replacement checklist resource for launch readiness review"
      : resource.title,
  desc:
    index === 0
      ? "A longer resource description used to check whether cards remain readable when explaining content replacement, proof ownership, and launch approval."
      : resource.desc,
}));

const meta = {
  title: "Sections/ResourcesSectionView",
  component: ResourcesSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Starter resources",
    subtitle: "Point visitors to replaceable guides, proof, and next steps.",
    resources: sectionStoryResources,
  },
} satisfies Meta<typeof ResourcesSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    title: "Long resource grid title for starter replacement and review",
    resources: longResources,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "模板资源",
    subtitle: "引导访客查看可替换指南、证明材料和下一步行动。",
    resources: sectionStoryResources.map((resource, index) => ({
      ...resource,
      title:
        ["替换清单", "内容指南", "视觉审查", "证明资料"][index] ??
        resource.title,
      desc: "上线前请替换为真实项目资料，并确认内容来源。",
    })),
  },
};
