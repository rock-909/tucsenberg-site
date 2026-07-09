import type { HeroSectionContent } from "@/components/sections/hero-section-view";

export const homepageStoryHero = {
  eyebrow: "Modern B2B showcase starter",
  title:
    "Present products, applications, and delivery proof in one clear B2B website.",
  subtitle:
    "Use this replaceable example to organize product families, application fit, proof points, and inquiry paths before a real company replaces the content.",
  primaryCta: { label: "View product systems", href: "/products" },
  secondaryCta: { label: "Plan an inquiry", href: "/contact" },
  proofAriaLabel: "Homepage proof categories",
  proofItems: [
    { value: "Product", label: "systems" },
    { value: "Application", label: "fit" },
    { value: "Delivery", label: "proof" },
    { value: "Inquiry", label: "ready" },
  ],
  diagram: {
    kind: "boxwall",
    panelLabel: "PRODUCT PRINCIPLE",
    ariaLabel: "Product working-principle line drawing placeholder",
    caption: "Replace with your product's working-principle drawing.",
  },
} satisfies HeroSectionContent;

export const homepageStoryHeroZh = {
  ...homepageStoryHero,
  eyebrow: "现代 B2B 展示型网站模板",
  title: "在一个清晰的 B2B 官网里呈现产品、应用和交付证明。",
  subtitle:
    "用这套可替换示例组织产品体系、应用适配、证明信息和询盘路径，等真实公司接手后再替换成自己的内容。",
  primaryCta: { label: "查看产品体系", href: "/products" },
  secondaryCta: { label: "规划询盘", href: "/contact" },
  proofAriaLabel: "首页证明分类",
  proofItems: [
    { value: "产品", label: "体系" },
    { value: "应用", label: "适配" },
    { value: "交付", label: "证据" },
    { value: "询盘", label: "就绪" },
  ],
  diagram: {
    kind: "boxwall",
    panelLabel: "产品原理",
    ariaLabel: "产品工作原理线描占位图",
    caption: "上线前替换为你产品的工作原理图。",
  },
} satisfies HeroSectionContent;

export const homepageStoryHeroLongCopy = {
  ...homepageStoryHero,
  title:
    "A flexible B2B showcase starter for teams that need product systems, application fit, delivery proof, resources, and inquiry content in one reviewable flow.",
  subtitle:
    "This long-copy story checks whether the hero can handle real-world descriptions without crushing the CTA row, preview card, or proof strip on narrower screens.",
} satisfies HeroSectionContent;
