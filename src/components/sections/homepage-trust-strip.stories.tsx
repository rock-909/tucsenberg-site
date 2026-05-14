import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  HomepageTrustStrip,
  type HomepageTrustStripItem,
} from "@/components/sections/homepage-trust-strip";

const defaultItems = [
  { key: "starter", value: "2024", label: "Starter base" },
  { key: "sections", value: "6", label: "Homepage sections" },
  { key: "workflow", value: "Ready", label: "AI workflow" },
] satisfies HomepageTrustStripItem[];

const withoutLabelsItems = [
  { key: "starter-ready", value: "Starter-ready" },
  { key: "storybook-covered", value: "Storybook covered" },
  { key: "replaceable", value: "Replaceable content" },
] satisfies HomepageTrustStripItem[];

const longChineseItems = [
  {
    key: "replacement",
    value: "可替换网站模板",
    label: "用于检查较长中文信任信息是否能够自然换行",
  },
  {
    key: "workflow",
    value: "多区块复用",
    label: "覆盖首页展示、证明材料和询盘入口",
  },
  {
    key: "review",
    value: "Storybook 审查",
    label: "帮助上线前逐个确认展示状态",
  },
] satisfies HomepageTrustStripItem[];

const meta = {
  title: "Sections/HomepageTrustStrip",
  component: HomepageTrustStrip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    ariaLabel: "Homepage proof facts",
    items: defaultItems,
  },
} satisfies Meta<typeof HomepageTrustStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutLabels: Story = {
  args: {
    ariaLabel: "Homepage proof facts without labels",
    items: withoutLabelsItems,
  },
};

export const Inverse: Story = {
  args: {
    ariaLabel: "Homepage inverse proof facts",
    items: defaultItems,
    tone: "inverse",
    emphasizeValues: false,
  },
  render: (args) => (
    <div className="rounded-2xl bg-primary p-6">
      <HomepageTrustStrip {...args} />
    </div>
  ),
};

export const LongChineseItems: Story = {
  args: {
    ariaLabel: "Homepage long Chinese proof facts",
    items: longChineseItems,
  },
};
