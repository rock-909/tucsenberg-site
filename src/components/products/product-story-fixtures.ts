import type {
  MarketDefinition,
  ProductFamilyDefinition,
} from "@/constants/product-catalog";
import type { FamilySpecs, SpecGroup } from "@/constants/product-specs/types";

export const productStoryMarket = {
  slug: "starter-market",
  label: "Starter market example",
  standardLabel: "Example standard",
  description:
    "A replaceable market card for product, service, or project offerings.",
  sizeSystem: "inch",
  standardIds: ["example-a"],
  familySlugs: ["starter-family"],
} satisfies MarketDefinition;

export const productStoryLongMarket = {
  ...productStoryMarket,
  slug: "long-starter-market",
  label:
    "Long starter market label for product, service, and project replacement review",
  standardLabel: "Long example standard label",
  description:
    "A longer replaceable description used to check card copy, spacing, image behavior, and link affordance before a real catalog is added.",
} satisfies MarketDefinition;

export const productStoryChineseMarket = {
  ...productStoryMarket,
  slug: "starter-market-zh",
  label: "示例市场分类",
  standardLabel: "示例标准",
  description: "用于替换为真实产品、服务或项目内容的中文示例卡片。",
} satisfies MarketDefinition;

export const productStoryFamily = {
  slug: "starter-family",
  label: "Starter family",
  description: "Replace this product or service family before launch.",
  marketSlug: productStoryMarket.slug,
} satisfies ProductFamilyDefinition;

export const productStorySpecs = {
  slug: productStoryFamily.slug,
  images: ["/images/products/sample-product-a.svg"],
  highlights: [
    "Replaceable product or service highlight",
    "Works with generic starter inquiry flow",
    "Prepared for visual and content review",
  ],
  specGroups: [
    {
      groupLabel: "General options",
      columns: ["Option", "Value", "Review note"],
      rows: [
        ["Starter A", "Replaceable", "Use verified content before launch"],
        ["Starter B", "Configurable", "Check with project owner"],
      ],
    },
    {
      groupLabel: "Delivery example",
      columns: ["Step", "Owner", "Output"],
      rows: [
        ["Discovery", "Project team", "Replacement checklist"],
        ["Review", "Owner", "Approved starter content"],
      ],
    },
  ],
} satisfies FamilySpecs;

export const productStoryLongSpecs = {
  ...productStorySpecs,
  highlights: [
    "Long replaceable highlight for a product, service, or project offering that needs extra detail",
    "Checks whether the overview column stays readable when a real implementation has longer proof copy",
    "Keeps generic starter wording so this fixture does not become production truth",
  ],
} satisfies FamilySpecs;

export const productStoryChineseSpecs = {
  ...productStorySpecs,
  highlights: [
    "可替换的产品或服务亮点",
    "适配通用模板询盘流程",
    "用于视觉和内容审查",
  ],
  specGroups: [
    {
      groupLabel: "通用选项",
      columns: ["选项", "数值", "审查说明"],
      rows: [
        ["模板 A", "可替换", "上线前替换为已验证内容"],
        ["模板 B", "可配置", "需要项目负责人确认"],
      ],
    },
  ],
} satisfies FamilySpecs;

export const productStoryWideSpecGroups = [
  {
    groupLabel: "Wide comparison table",
    columns: [
      "Model",
      "Use case",
      "Long attribute label",
      "Proof requirement",
      "Replacement owner",
      "Launch note",
    ],
    rows: [
      [
        "Starter A",
        "Product",
        "Long configurable attribute value",
        "Verified proof",
        "Project owner",
        "Replace before public launch",
      ],
      [
        "Starter B",
        "Service",
        "Another long configurable attribute value",
        "Reviewed claim",
        "Content owner",
        "Keep generic until real evidence exists",
      ],
    ],
  },
] satisfies SpecGroup[];

export const productStoryStickyFamilies = [
  { slug: "overview", label: "Overview" },
  { slug: "starter-a", label: "Starter A" },
  { slug: "starter-b", label: "Starter B" },
  { slug: "starter-c", label: "Starter C" },
  { slug: "starter-d", label: "Starter D" },
  { slug: "starter-e", label: "Starter E" },
  { slug: "long-family", label: "Long replacement family label" },
  { slug: "starter-zh", label: "中文系列示例" },
] as const;

export const productStoryTechnicalSpecs = {
  "Content surface": "Product, service, or project detail",
  "Replacement owner": "Project owner",
  "Review state": "Starter fixture",
} as const;
