import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SpecTable } from "@/components/products/spec-table";
import {
  productStoryChineseSpecs,
  productStorySpecs,
  productStoryWideSpecGroups,
} from "@/components/products/product-story-fixtures";

const meta = {
  title: "Products/SpecTable",
  component: SpecTable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    specGroups: productStorySpecs.specGroups,
    className: "w-[720px]",
  },
} satisfies Meta<typeof SpecTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChineseCopy: Story = {
  args: {
    specGroups: productStoryChineseSpecs.specGroups,
  },
};

export const Overflow: Story = {
  args: {
    specGroups: productStoryWideSpecGroups,
    className: "w-[360px]",
  },
};

export const Empty: Story = {
  args: {
    specGroups: [],
  },
};
