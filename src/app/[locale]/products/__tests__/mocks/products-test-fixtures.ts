import { screen } from "@testing-library/react";
import { expect } from "vitest";

export const mockCatalogTranslationsEn = {
  "overview.title": "Product overview",
  "overview.description":
    "Use this page to introduce the main product lines or offer groups visitors should understand before they contact you.",
  "overview.cardsTitle": "What visitors should learn here",
  "overview.cardsDescription":
    "Keep the default overview short. Replace these cards with real product groups, proof materials, and buying steps.",
  "overview.boundaryTitle": "Replace before launch",
  "overview.boundaryDescription":
    "The structure is ready, but the business facts must come from the real company.",
  "overview.pathTitle": "How this overview should work",
  "overview.pathDescription":
    "Keep the page as a simple map: show offer groups, point to proof, then route the visitor to resources or contact.",
  "overview.detailTitle": "Use detail pages only when needed",
  "overview.detailDescription":
    "Stay with this lightweight overview until the real business has product families, comparison rules, and quote logic ready.",
  "overviewCards.mainOffer.title": "Product groups",
  "overviewCards.mainOffer.description":
    "Summarize the main categories, packages, or product lines a visitor needs to compare.",
  "overviewCards.proofMaterials.title": "Proof materials",
  "overviewCards.proofMaterials.description":
    "Point to brochures, photos, examples, or documents that help a buyer trust the offer.",
  "overviewCards.nextStep.title": "Buying next step",
  "overviewCards.nextStep.description":
    "Make it clear when visitors should read resources, ask a question, or request a quote.",
  "boundary.items.content": "Replace product names and descriptions",
  "boundary.items.assets": "Replace images, brochures, and proof",
  "boundary.items.details": "Add real availability, pricing, or quote rules",
  "path.items.scan.title": "Scan product groups",
  "path.items.scan.description":
    "Help visitors understand the offer families before they ask for specifics.",
  "path.items.compare.title": "Check proof materials",
  "path.items.compare.description":
    "Send visitors to resources when they need brochures, photos, or buyer guidance.",
  "path.items.ask.title": "Ask for fit",
  "path.items.ask.description":
    "Move visitors to contact when they need pricing, availability, or project fit.",
  "detail.items.families": "Real product families and priorities are confirmed",
  "detail.items.comparison":
    "Specifications or comparison rules affect buying decisions",
  "detail.items.markets":
    "Markets, standards, or availability need separate pages",
  "cta.title": "Need more detail before contacting?",
  "cta.description":
    "Use Resources for supporting materials, or contact the team when the visitor is ready for the next step.",
  "cta.resources": "View resources",
  "cta.contact": "Contact",
} as const;

export const mockCatalogTranslationsZh = {
  "overview.title": "产品概览",
  "overview.description":
    "用这个页面介绍访客在联系前需要了解的主要产品线或业务组合。",
  "overview.cardsTitle": "访客应该在这里了解什么",
  "overview.cardsDescription":
    "默认概览要短。把这些卡片替换成真实产品组、证明材料和购买下一步。",
  "overview.boundaryTitle": "上线前需要替换",
  "overview.boundaryDescription":
    "结构已经准备好，但真实业务事实必须来自真实公司。",
  "overview.pathTitle": "这个概览页应该怎么发挥作用",
  "overview.pathDescription":
    "把页面保持成简单地图：展示业务组合、指向证明材料，再把访客引导到资料或联系入口。",
  "overview.detailTitle": "只有真正需要时才使用详情页",
  "overview.detailDescription":
    "在真实业务的产品系列、比较规则和报价逻辑准备好前，先保持轻量概览。",
  "overviewCards.mainOffer.title": "产品组合",
  "overviewCards.mainOffer.description":
    "概括访客需要比较的主要类别、套餐或产品线。",
  "overviewCards.proofMaterials.title": "证明材料",
  "overviewCards.proofMaterials.description":
    "指向手册、图片、示例或资料，帮助买家判断可信度。",
  "overviewCards.nextStep.title": "购买下一步",
  "overviewCards.nextStep.description":
    "说明访客什么时候该看资料、提问题或提交询价。",
  "boundary.items.content": "替换产品名称和介绍",
  "boundary.items.assets": "替换图片、手册和证明材料",
  "boundary.items.details": "补充真实供货、价格或报价规则",
  "path.items.scan.title": "浏览产品组合",
  "path.items.scan.description": "让访客先理解业务系列，再询问具体细节。",
  "path.items.compare.title": "查看证明材料",
  "path.items.compare.description":
    "当访客需要手册、图片或买家指南时，引导到资料页。",
  "path.items.ask.title": "询问适配性",
  "path.items.ask.description":
    "当访客需要价格、供货或项目适配判断时，引导到联系页。",
  "detail.items.families": "真实产品系列和优先级已经确认",
  "detail.items.comparison": "规格或比较规则会影响采购判断",
  "detail.items.markets": "市场、标准或供货情况需要独立页面",
  "cta.title": "联系前需要更多资料？",
  "cta.description": "可以先查看资料页，也可以在访客准备好时直接联系。",
  "cta.resources": "查看资料",
  "cta.contact": "联系",
} as const;

export function createCatalogTranslator(
  locale: string,
): (key: string) => string {
  const translations =
    locale === "zh" ? mockCatalogTranslationsZh : mockCatalogTranslationsEn;

  return (key: string) => translations[key as keyof typeof translations] || key;
}

export function assertNoHeavyCatalogOrDeveloperDemoCopy() {
  expect(screen.queryByText(/Technical proof/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Cloudflare\/OpenNext/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Example Standard/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/certification/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/spec matrix/i)).not.toBeInTheDocument();
}
