import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ProductCertifications,
  ProductSpecs,
  ProductTradeInfo,
} from "@/components/products/product-specs";
import { productStoryTechnicalSpecs } from "@/components/products/product-story-fixtures";

interface ProductSpecsStoryProps {
  specs: Record<string, string>;
  certifications: string[];
  title: string;
}

function ProductSpecsStory({
  specs,
  certifications,
  title,
}: ProductSpecsStoryProps) {
  return (
    <div className="w-[680px] space-y-6">
      <ProductSpecs specs={specs} title={title} />
      <ProductCertifications certifications={certifications} />
      <ProductTradeInfo
        moq="Replace per project"
        leadTime="Confirm before launch"
        supplyCapacity="Use verified capacity only"
        packaging="Generic starter packaging note"
        portOfLoading="Replace with real location"
      />
    </div>
  );
}

const meta = {
  title: "Products/ProductSpecs",
  component: ProductSpecsStory,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    specs: productStoryTechnicalSpecs,
    certifications: ["Example proof", "Starter review"],
    title: "Technical starter details",
  },
} satisfies Meta<typeof ProductSpecsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    specs: {
      "Long replaceable specification label":
        "Long value used to check whether specification rows stay readable.",
      "Proof and replacement requirement":
        "Replace this generic value with verified project evidence.",
      "Review ownership":
        "Project owner, content reviewer, and launch approver",
    },
    certifications: [
      "Long replaceable certification or proof item",
      "Another review-ready proof label",
    ],
  },
};

export const ChineseCopy: Story = {
  args: {
    specs: {
      内容表面: "产品、服务或项目详情",
      替换负责人: "项目负责人",
      审查状态: "模板示例",
    },
    certifications: ["示例证明", "模板审查"],
    title: "中文规格示例",
  },
};

export const Empty: Story = {
  args: {
    specs: {},
    certifications: [],
  },
};
