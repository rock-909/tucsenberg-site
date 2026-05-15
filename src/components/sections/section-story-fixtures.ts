import type { FaqSectionItem } from "@/components/sections/faq-section-view";

export const sectionStoryFaqItems = [
  {
    key: "fit",
    question: "What should be replaced before launch?",
    answer:
      "Replace example product, service, proof, resource, and contact details with verified project content.",
  },
  {
    key: "proof",
    question: "Can placeholder proof stay in the public site?",
    answer:
      "No. Keep starter examples generic until the project owner provides verified proof.",
  },
] satisfies FaqSectionItem[];

export const sectionStoryFaqLongItems = [
  {
    key: "long-fit",
    question:
      "How does this starter handle long product, service, proof, and inquiry questions from a real project team?",
    answer:
      "Use this long answer to check wrapping, spacing, and readability when the FAQ content explains replacement scope, ownership, launch proof, and next-step expectations in more detail.",
  },
  ...sectionStoryFaqItems,
] satisfies FaqSectionItem[];

export const sectionStoryFaqChineseItems = [
  {
    key: "zh-fit",
    question: "上线前需要替换哪些内容？",
    answer: "请替换产品、服务、证明材料、资源内容和联系信息里的示例文案。",
  },
  {
    key: "zh-proof",
    question: "占位证明可以直接上线吗？",
    answer: "不可以。只有经过项目负责人确认的真实证明，才能放到公开网站。",
  },
] satisfies FaqSectionItem[];
