import type { LinkHref } from "@/lib/i18n/route-parsing";
import type { FinalCtaContent } from "@/components/sections/final-cta-view";
import type { HeroSectionContent } from "@/components/sections/hero-section-view";
import type { QualitySectionContent } from "@/components/sections/quality-section-view";
import type { ScenarioSectionItem } from "@/components/sections/scenarios-section-view";

export type HomepageStoryHeroContent = HeroSectionContent;

export interface HomepageStoryProductItem {
  id: string;
  tag: string;
  title: string;
  specs: string[];
  meta: string;
  link: LinkHref;
}

export type HomepageStoryQualityContent = QualitySectionContent;
export type HomepageStoryScenarioItem = ScenarioSectionItem;

export type HomepageStoryFinalCtaContent = FinalCtaContent;

export const homepageStoryHero = {
  eyebrow: "Reusable Website Starter",
  title: "A showcase website starter built for clear evaluation.",
  subtitle:
    "Use this replaceable example to present offerings, proof, resources, and an inquiry path without rebuilding the site from scratch.",
  primaryCta: { label: "Start inquiry", href: "/contact" },
  secondaryCta: { label: "View offerings", href: "/products" },
  proofItems: [
    { value: "2024", label: "Starter base" },
    { value: "3+", label: "Offer types" },
    { value: "Ready", label: "Workflow" },
  ],
  preview: {
    label: "Starter preview",
    title: "Built-in website system",
    description:
      "Preview page structure, component reuse, content replacement, and inquiry flow before a real launch.",
    items: ["Pages", "Components", "Storybook", "AI workflow"],
    note: "Replace example content before launch",
  },
} satisfies HomepageStoryHeroContent;

export const homepageStoryHeroZh = {
  ...homepageStoryHero,
  eyebrow: "可复用展示型网站模板",
  title: "用于清晰展示与快速评估的网站起点。",
  subtitle:
    "用这套可替换示例展示产品、服务、能力证明、资源内容和询盘入口，不需要从零重建网站。",
  primaryCta: { label: "开始询盘", href: "/contact" },
  secondaryCta: { label: "查看内容", href: "/products" },
  proofItems: [
    { value: "2024", label: "模板基线" },
    { value: "3+", label: "内容类型" },
    { value: "就绪", label: "工作流" },
  ],
  preview: {
    label: "模板预览",
    title: "内置网站系统",
    description: "在正式上线前，先预览页面结构、组件复用、内容替换和询盘路径。",
    items: ["页面", "组件", "Storybook", "AI 工作流"],
    note: "上线前请替换示例内容",
  },
} satisfies HomepageStoryHeroContent;

export const homepageStoryHeroLongCopy = {
  ...homepageStoryHero,
  title:
    "A flexible showcase website starter for teams that need product, service, proof, resources, and inquiry content in one reviewable flow.",
  subtitle:
    "This long-copy story checks whether the hero can handle real-world descriptions without crushing the CTA row, preview card, or proof strip on narrower screens.",
} satisfies HomepageStoryHeroContent;

export const homepageStoryProducts = [
  {
    id: "product",
    tag: "Product example",
    title: "Product showcase",
    specs: [
      "Categories, highlights, and specs",
      "Cards, market pages, and detail sections",
      "Replace with real product data",
    ],
    meta: "Example catalog",
    link: "/products",
  },
  {
    id: "service",
    tag: "Service example",
    title: "Service showcase",
    specs: [
      "Use cases, process, and outcomes",
      "Proof, resources, and references",
      "Replace with real service scope",
    ],
    meta: "Example service",
    link: "/contact",
  },
  {
    id: "custom",
    tag: "Custom project",
    title: "Custom project support",
    specs: [
      "Discovery, proposal, and delivery",
      "Brand adaptation and configuration",
      "Replace with real custom workflow",
    ],
    meta: "Per project scope",
    link: "/contact",
  },
] satisfies HomepageStoryProductItem[];

export const homepageStoryProductsZh = [
  {
    id: "product",
    tag: "产品示例",
    title: "产品展示",
    specs: ["分类、亮点和规格", "卡片、列表和详情模块", "替换为真实产品数据"],
    meta: "示例目录",
    link: "/products",
  },
  {
    id: "service",
    tag: "服务示例",
    title: "服务展示",
    specs: [
      "使用场景、流程和结果",
      "证明材料、资源和参考资料",
      "替换为真实服务范围",
    ],
    meta: "示例服务",
    link: "/contact",
  },
  {
    id: "custom",
    tag: "项目支持",
    title: "定制项目支持",
    specs: ["需求确认、方案和交付", "品牌适配和配置", "替换为真实项目流程"],
    meta: "按项目范围",
    link: "/contact",
  },
] satisfies HomepageStoryProductItem[];

export const homepageStoryQuality = {
  title: "Starter commitments",
  subtitle:
    "Use this area to explain what a visitor can trust before they submit an inquiry.",
  commitments: [
    {
      key: "response",
      title: "Clear response window",
      description:
        "State the real response time visitors can expect after submitting an inquiry.",
    },
    {
      key: "proof",
      title: "Verified proof only",
      description:
        "Replace placeholder claims with evidence the real project can support.",
    },
    {
      key: "reuse",
      title: "Reusable page system",
      description:
        "Keep page sections modular so future AI work can reuse them safely.",
    },
    {
      key: "contact",
      title: "Simple contact path",
      description:
        "Keep the primary inquiry path visible and easy to complete.",
    },
  ],
  certificationsTitle: "Proof and standards",
  certificationName: "Replaceable proof item",
  certificationNumber: "Example reference",
  certifiedLabel: "Verified",
  applyingLabel: "In review",
  compliantLabel: "Ready",
  standards: [
    { key: "content", label: "Content reviewed", status: "certified" },
    { key: "visual", label: "Visual system", status: "compliant" },
    { key: "storybook", label: "Storybook review", status: "applying" },
    { key: "launch", label: "Launch checklist", status: "compliant" },
  ],
  proofTitle: "Replaceable proof and reference area",
  proofNote:
    "Use this proof strip only for verified certifications, references, and project evidence in a real website.",
  proofItems: [
    { key: "checks", value: "4", label: "Example checks" },
    { key: "surfaces", value: "3", label: "Review surfaces" },
    { key: "status", value: "Ready", label: "Starter status" },
  ],
} satisfies HomepageStoryQualityContent;

export const homepageStoryQualityZh = {
  ...homepageStoryQuality,
  title: "模板承诺",
  subtitle: "用这一区块说明访客在提交询盘前可以相信什么。",
  commitments: [
    {
      key: "response",
      title: "清晰响应时间",
      description: "说明访客提交询盘后可以期待的真实回复时间。",
    },
    {
      key: "proof",
      title: "只展示可验证证明",
      description: "把占位声明替换成真实项目能够支持的证据。",
    },
    {
      key: "reuse",
      title: "可复用页面系统",
      description: "保持页面区块模块化，方便后续 AI 安全复用。",
    },
    {
      key: "contact",
      title: "简单联系路径",
      description: "让主要询盘入口始终清楚、容易完成。",
    },
  ],
  certificationsTitle: "证明和标准",
  certificationName: "可替换证明项",
  certificationNumber: "示例编号",
  certifiedLabel: "已验证",
  applyingLabel: "审核中",
  compliantLabel: "就绪",
  standards: [
    { key: "content", label: "内容已审核", status: "certified" },
    { key: "visual", label: "视觉系统", status: "compliant" },
    { key: "storybook", label: "Storybook 审查", status: "applying" },
    { key: "launch", label: "上线检查清单", status: "compliant" },
  ],
  proofTitle: "可替换证明和参考区域",
  proofNote: "真实网站中只放已验证的认证、参考资料和项目证据。",
  proofItems: [
    { key: "checks", value: "4", label: "示例检查" },
    { key: "surfaces", value: "3", label: "审查表面" },
    { key: "status", value: "就绪", label: "模板状态" },
  ],
} satisfies HomepageStoryQualityContent;

export const homepageStoryScenarios = [
  {
    key: "product",
    iconKey: "product",
    eyebrow: "Use case 1",
    badge: "Starter fit",
    title: "Product showcase",
    description:
      "Use cards, spec tables, resources, and inquiry CTAs to help visitors evaluate an offer quickly.",
    proofLabel: "Replaceable use case",
    quote: "Replace this with a real customer quote only after it is verified.",
  },
  {
    key: "service",
    iconKey: "service",
    eyebrow: "Use case 2",
    badge: "Starter fit",
    title: "Service business",
    description:
      "Explain process, deliverables, proof, and next steps without rebuilding the page system.",
    proofLabel: "Replaceable use case",
    quote:
      "Use this area for a real service result, testimonial, or case note.",
  },
  {
    key: "custom",
    iconKey: "custom",
    eyebrow: "Use case 3",
    badge: "Starter fit",
    title: "Custom project",
    description:
      "Show discovery, proposal, configuration, approval, and delivery steps for tailored work.",
    proofLabel: "Replaceable use case",
    quote: "Add real project proof here after the new site has evidence.",
  },
] satisfies HomepageStoryScenarioItem[];

export const homepageStoryScenariosZh = [
  {
    key: "product",
    iconKey: "product",
    eyebrow: "场景 1",
    badge: "模板适用",
    title: "产品展示",
    description: "用卡片、规格表、资源和询盘入口帮助访客快速评估内容。",
    proofLabel: "可替换场景",
    quote: "只有在确认真实来源后，才把这里替换为客户评价。",
  },
  {
    key: "service",
    iconKey: "service",
    eyebrow: "场景 2",
    badge: "模板适用",
    title: "服务业务",
    description: "说明流程、交付内容、证明材料和下一步行动。",
    proofLabel: "可替换场景",
    quote: "这里可以放真实服务结果、客户反馈或案例说明。",
  },
  {
    key: "custom",
    iconKey: "custom",
    eyebrow: "场景 3",
    badge: "模板适用",
    title: "定制项目",
    description: "展示需求确认、方案、配置、审批和交付步骤。",
    proofLabel: "可替换场景",
    quote: "等新网站有真实证据后，再在这里加入项目证明。",
  },
] satisfies HomepageStoryScenarioItem[];

export const homepageStoryFinalCta = {
  title: "Ready to adapt this starter for a real website?",
  description:
    "Replace this final call to action with the next step you want qualified visitors to take.",
  primary: { label: "Start inquiry", href: "/contact" },
  secondary: { label: "View offerings", href: "/products" },
  trustAriaLabel: "Homepage trust facts",
  trustItems: [
    { key: "starter-ready", value: "Starter-ready" },
    { key: "reusable-sections", value: "Reusable sections" },
    { key: "replaceable-content", value: "Replaceable content" },
  ],
} satisfies HomepageStoryFinalCtaContent;

export const homepageStoryFinalCtaZh = {
  title: "准备把这套模板替换成真实网站了吗？",
  description: "把这里替换成你希望合格访客采取的下一步行动。",
  primary: { label: "开始询盘", href: "/contact" },
  secondary: { label: "查看内容", href: "/products" },
  trustAriaLabel: "首页信任信息",
  trustItems: [
    { key: "starter-ready", value: "模板就绪" },
    { key: "reusable-sections", value: "区块可复用" },
    { key: "replaceable-content", value: "内容可替换" },
  ],
} satisfies HomepageStoryFinalCtaContent;
