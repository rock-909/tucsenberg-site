import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductFamilyContextNotice } from "@/components/contact/product-family-context-notice";
import { PRODUCT_FAMILY_CONTACT_INTENT } from "@/lib/contact/product-family-context";

const meta = {
  title: "Contact/ProductFamilyContextNotice",
  component: ProductFamilyContextNotice,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Inquiry context",
    context: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      marketSlug: "starter-market",
      marketLabel: "Starter market",
      familySlug: "starter-family",
      familyLabel: "Starter family",
    },
  },
} satisfies Meta<typeof ProductFamilyContextNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongFamilyName: Story = {
  args: {
    context: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      marketSlug: "long-market",
      marketLabel: "Long replacement market label for layout review",
      familySlug: "long-family",
      familyLabel:
        "Very long replaceable product or service family name used by a starter project",
    },
  },
};

export const ChineseCopy: Story = {
  args: {
    label: "询盘来源",
    context: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      marketSlug: "starter-market-zh",
      marketLabel: "示例市场分类",
      familySlug: "starter-family-zh",
      familyLabel: "较长的中文产品或服务系列名称",
    },
  },
};
