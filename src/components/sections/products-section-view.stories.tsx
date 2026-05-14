import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryProducts,
  homepageStoryProductsZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  ProductsSectionView,
  type ProductsSectionProductItem,
} from "@/components/sections/products-section-view";

const homepageStoryProductsLongCopy = homepageStoryProducts.map(
  (product, index) => ({
    ...product,
    title:
      index === 0
        ? "Flexible product, service, and proof showcase for a replaceable website starter"
        : product.title,
    specs:
      index === 0
        ? [
            "Long category names, detailed highlights, and specification summaries",
            "Cards, market pages, resource links, and detail sections in one reviewable flow",
            "Replace this copy with real product or service data before launch",
          ]
        : product.specs,
  }),
) satisfies ProductsSectionProductItem[];

const meta = {
  title: "Sections/ProductsSectionView",
  component: ProductsSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Offerings built for quick review",
    subtitle:
      "Use this section to show replaceable products, services, or project options with clear next steps.",
    ctaLabel: "View all offerings",
    ctaHref: "/products",
    products: homepageStoryProducts,
  },
} satisfies Meta<typeof ProductsSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    title:
      "A flexible offerings section for product, service, and project paths",
    subtitle:
      "This long-copy story checks whether the section still reads clearly when real-world descriptions and longer product names are used.",
    products: homepageStoryProductsLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "用于快速评估的内容展示",
    subtitle:
      "用这个区块展示可替换的产品、服务或项目选项，并给访客一个清晰的下一步。",
    ctaLabel: "查看全部内容",
    products: homepageStoryProductsZh,
  },
};

export const NarrowCanvas: Story = {
  args: {
    products: homepageStoryProductsLongCopy,
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
