import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  homepageStoryScenarios,
  homepageStoryScenariosZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  ScenariosSectionView,
  type ScenarioSectionItem,
} from "@/components/sections/scenarios-section-view";

const homepageStoryScenariosLongCopy = homepageStoryScenarios.map(
  (item, index) => ({
    ...item,
    title:
      index === 0
        ? "Flexible product, service, proof, resource, and inquiry showcase"
        : item.title,
    description:
      index === 0
        ? "Use longer descriptions to check whether the scenario cards still keep the visual surface, proof label, body copy, and testimonial area readable in one reviewable section."
        : item.description,
    quote:
      index === 0
        ? "Replace this long example quote with verified proof only after the real project has a customer source, approval trail, and reusable evidence."
        : item.quote,
  }),
) satisfies ScenarioSectionItem[];

const homepageStoryScenariosLongChineseCopy = homepageStoryScenariosZh.map(
  (item, index) => ({
    ...item,
    badge: index === 0 ? "适合多种展示型网站替换" : item.badge,
    title:
      index === 0
        ? "用于检查中文长标题、长说明和长证明文案的场景卡片"
        : item.title,
    description:
      index === 0
        ? "这个场景模拟真实中文业务介绍变长后的情况，检查场景卡片顶部视觉区域、标签、正文说明和引用内容是否仍然清楚、稳定、容易阅读。"
        : item.description,
    quote:
      index === 0
        ? "只有在真实项目已经拿到客户来源、确认记录和可复用证据之后，才把这里替换为较长的中文客户评价。"
        : item.quote,
  }),
) satisfies ScenarioSectionItem[];

const meta = {
  title: "Sections/ScenariosSection",
  component: ScenariosSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Use cases this starter can support",
    subtitle:
      "Use this section to explain which visitor situations, buyer needs, or project types the website can support.",
    items: homepageStoryScenarios,
  },
} satisfies Meta<typeof ScenariosSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    title: "Use cases that need longer proof and evaluation copy",
    subtitle:
      "This long-copy story checks whether scenario cards still read clearly when a real website needs fuller context, longer descriptions, and longer proof notes.",
    items: homepageStoryScenariosLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "这套模板可以支持的使用场景",
    subtitle: "用这个区块说明网站可以支持哪些访客情况、买家需求或项目类型。",
    items: homepageStoryScenariosZh,
  },
};

export const LongChineseCopy: Story = {
  args: {
    title: "用于检查中文长标题、长副标题和长场景内容是否稳定展示的场景区块",
    subtitle:
      "这个场景专门模拟真实中文业务介绍变长后的情况，检查标题、副标题、徽标、正文说明、证明标签和引用内容在不同文案长度下是否仍然清楚、稳定、容易阅读。",
    items: homepageStoryScenariosLongChineseCopy,
  },
};
