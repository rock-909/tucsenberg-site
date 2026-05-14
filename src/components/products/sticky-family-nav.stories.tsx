import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StickyFamilyNav } from "@/components/products/sticky-family-nav";
import { productStoryStickyFamilies } from "@/components/products/product-story-fixtures";

const meta = {
  title: "Products/StickyFamilyNav",
  component: StickyFamilyNav,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    families: [...productStoryStickyFamilies],
    ariaLabel: "Product families",
  },
} satisfies Meta<typeof StickyFamilyNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    families: [
      { slug: "long-a", label: "Long replacement family label A" },
      { slug: "long-b", label: "Long replacement family label B" },
      { slug: "long-c", label: "Long replacement family label C" },
      { slug: "long-d", label: "Long replacement family label D" },
    ],
  },
};

export const ChineseCopy: Story = {
  args: {
    ariaLabel: "产品系列",
    families: [
      { slug: "family-a", label: "中文系列一" },
      { slug: "family-b", label: "较长的中文系列二" },
      { slug: "family-c", label: "中文系列三" },
    ],
  },
};

export const Overflow: Story = {
  args: {
    families: [...productStoryStickyFamilies],
    ariaLabel: "Many product families",
  },
};
