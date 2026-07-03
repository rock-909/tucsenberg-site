import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MarketSeriesCard } from "@/components/products/market-series-card";
import {
  productStoryChineseMarket,
  productStoryLongMarket,
  productStoryMarket,
} from "@/components/products/product-story-fixtures";

const meta = {
  title: "Products/MarketSeriesCard",
  component: MarketSeriesCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    slug: productStoryMarket.slug,
    label: productStoryMarket.label,
    description: productStoryMarket.description,
    standardLabel: productStoryMarket.standardLabel,
    familyCountLabel: "3 example families",
  },
} satisfies Meta<typeof MarketSeriesCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    slug: productStoryLongMarket.slug,
    label: productStoryLongMarket.label,
    description: productStoryLongMarket.description,
    standardLabel: productStoryLongMarket.standardLabel,
    familyCountLabel: "Long family count label for layout review",
  },
};

export const ChineseCopy: Story = {
  args: {
    slug: productStoryChineseMarket.slug,
    label: productStoryChineseMarket.label,
    description: productStoryChineseMarket.description,
    standardLabel: productStoryChineseMarket.standardLabel,
    familyCountLabel: "3 个示例系列",
  },
};

export const FallbackImage: Story = {
  args: {
    slug: "unknown-replacement-market",
    label: "Unknown market uses fallback image",
  },
};
