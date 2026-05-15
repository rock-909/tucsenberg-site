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
    label: "Inquiry source",
    context: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      marketSlug: "disc-membranes",
      marketLabel: "Disc replacement membranes",
      familySlug: "nine-inch-epdm",
      familyLabel: "9 inch disc EPDM membrane",
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
      marketLabel: "Long membrane replacement path label for layout review",
      familySlug: "long-family",
      familyLabel:
        "Very long replacement membrane family name used to review wrapping",
    },
  },
};

export const ChineseCopy: Story = {
  args: {
    label: "询盘来源",
    context: {
      intent: PRODUCT_FAMILY_CONTACT_INTENT,
      marketSlug: "disc-membranes-zh",
      marketLabel: "盘式替换膜片",
      familySlug: "nine-inch-epdm-zh",
      familyLabel: "9 寸盘式 EPDM 膜片",
    },
  },
};
