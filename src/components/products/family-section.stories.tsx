import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  FamilySection,
  type FamilySectionProps,
} from "@/components/products/family-section";
import {
  productStoryChineseSpecs,
  productStoryFamily,
  productStoryLongSpecs,
  productStorySpecs,
} from "@/components/products/product-story-fixtures";

function FamilySectionWithoutInquiry(props: FamilySectionProps) {
  const { inquiry: _inquiry, ...viewProps } = props;
  return <FamilySection {...viewProps} />;
}

const meta = {
  title: "Products/FamilySection",
  component: FamilySection,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    family: productStoryFamily,
    specs: productStorySpecs,
    familyLabel: "Starter family",
    familyDescription:
      "Replace this product, service, or project family description before launch.",
    inquiry: {
      href: "/contact",
      label: "Ask about this family",
    },
  },
} satisfies Meta<typeof FamilySection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    specs: productStoryLongSpecs,
    familyLabel:
      "Long starter family label for product, service, and project detail review",
    familyDescription:
      "This long-copy story checks whether the overview, highlights, image area, inquiry button, and specification table stay readable when real catalog content is longer.",
  },
};

export const ChineseCopy: Story = {
  args: {
    specs: productStoryChineseSpecs,
    familyLabel: "中文示例系列",
    familyDescription: "上线前请把这里替换为真实产品、服务或项目系列说明。",
    inquiry: {
      href: "/contact",
      label: "咨询这个系列",
    },
  },
};

export const WithoutInquiry: Story = {
  render: (args) => <FamilySectionWithoutInquiry {...args} />,
};
