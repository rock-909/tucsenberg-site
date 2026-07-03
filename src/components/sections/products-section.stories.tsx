import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
    meta:
      index === 0
        ? "Long example catalog label for layout review"
        : product.meta,
  }),
) satisfies ProductsSectionProductItem[];

const homepageStoryProductsLongChineseCopy = homepageStoryProductsZh.map(
  (product, index) => ({
    ...product,
    title:
      index === 0
        ? "适合替换为真实产品、真实服务和真实项目流程的长标题展示卡片"
        : product.title,
    specs:
      index === 0
        ? [
            "覆盖较长的中文分类名称、重点说明、规格摘要和访客评估信息",
            "用于检查卡片、列表、详情模块和询盘路径在中文长文下是否保持清楚",
            "上线前请把这些示例文案替换为真实业务、真实服务范围和真实证明材料",
          ]
        : product.specs,
    meta:
      index === 0 ? "较长的中文示例目录标签，用于版面压力检查" : product.meta,
  }),
) satisfies ProductsSectionProductItem[];

const meta = {
  title: "Sections/ProductsSection",
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
      "This long-copy story checks whether the section still reads clearly when real-world descriptions, longer product names, and longer meta labels are used.",
    ctaLabel: "Review the full offerings catalog",
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

export const LongChineseCopy: Story = {
  args: {
    title: "用于检查中文长标题、长说明和长标签是否稳定展示的产品区块",
    subtitle:
      "这个场景专门模拟真实中文业务介绍变长后的情况，检查标题、副标题、按钮文案、卡片规格和标签在不同内容长度下是否仍然清楚、稳定、容易阅读。",
    ctaLabel: "查看完整产品和服务展示内容",
    products: homepageStoryProductsLongChineseCopy,
  },
};
