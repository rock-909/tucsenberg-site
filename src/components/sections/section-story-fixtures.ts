import {
  StaticAwardIcon,
  StaticFileTextIcon,
  StaticFolderOpenIcon,
  StaticPencilRulerIcon,
} from "@/components/icons/static-icons";
import type {
  ChainStepItem,
  ChainSectionViewProps,
} from "@/components/sections/chain-section-view";
import type { FaqSectionItem } from "@/components/sections/faq-section-view";
import type { ResourceCardItem } from "@/components/sections/resources-section-view";
import type { SampleCtaContent } from "@/components/sections/sample-cta-view";
import type { StarterBoundaryContent } from "@/components/sections/starter-boundary-section-view";

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

export const sectionStoryChainSteps = Array.from({ length: 5 }, (_, index) => {
  const stepNumber = index + 1;
  return {
    num: String(stepNumber).padStart(2, "0"),
    title: `Review step ${String(stepNumber)}`,
    desc: "Replace starter content, check proof, and confirm the next visible website state.",
  };
}) satisfies ChainStepItem[];

export const sectionStoryChain = {
  title: "Starter review chain",
  subtitle:
    "Use this process section to explain how a visitor or project owner moves from review to inquiry.",
  steps: sectionStoryChainSteps,
  stats: ["Content mapped", "Proof checked", "Inquiry ready"],
} satisfies ChainSectionViewProps;

export const sectionStoryResources = [
  {
    Icon: StaticFolderOpenIcon,
    title: "Replacement checklist",
    desc: "Track the pages, components, content, and proof that need project-specific replacement.",
    link: "/how-it-works",
  },
  {
    Icon: StaticFileTextIcon,
    title: "Content guide",
    desc: "Keep starter examples generic until real project copy is approved.",
    link: "/products",
  },
  {
    Icon: StaticPencilRulerIcon,
    title: "Visual review",
    desc: "Use Storybook to inspect layout states before changing production pages.",
    link: "/products",
  },
  {
    Icon: StaticAwardIcon,
    title: "Proof library",
    desc: "Add only verified certifications, references, or evidence before launch.",
    link: "/contact",
  },
] satisfies ResourceCardItem[];

export const sectionStorySampleCta = {
  title: "Ready to replace this starter with real project content?",
  description:
    "Use this CTA to guide qualified visitors toward the next safe inquiry step.",
  cta: {
    label: "Start inquiry",
    href: "/contact",
  },
} satisfies SampleCtaContent;

export const sectionStorySampleCtaZh = {
  title: "准备把这套模板替换成真实项目内容了吗？",
  description: "用这个行动入口，引导合格访客进入下一步询盘。",
  cta: {
    label: "开始询盘",
    href: "/contact",
  },
} satisfies SampleCtaContent;

export const sectionStoryStarterBoundary = {
  title: "This polished site is still a starter",
  description:
    "Keep this reminder visible until example content, proof, and contact details are replaced.",
  listLabel: "Starter boundaries",
  items: [
    {
      title: "Replace content",
      description: "Swap generic product and service copy with verified text.",
    },
    {
      title: "Verify proof",
      description: "Use only real certificates, references, and results.",
    },
    {
      title: "Check routes",
      description: "Confirm all CTA destinations match the current project.",
    },
    {
      title: "Review Storybook",
      description: "Inspect component states before approving launch content.",
    },
  ],
  primary: { label: "Review workflow", href: "/how-it-works" },
  secondary: { label: "Contact team", href: "/contact" },
} satisfies StarterBoundaryContent;

export const sectionStoryStarterBoundaryZh = {
  title: "这个精致页面仍然是可替换模板",
  description: "在示例内容、证明材料和联系信息替换完成前，保留这个提醒。",
  listLabel: "模板边界",
  items: [
    {
      title: "替换内容",
      description: "把通用产品和服务文案替换成已确认内容。",
    },
    {
      title: "核验证明",
      description: "只使用真实认证、参考资料和结果。",
    },
    {
      title: "检查路径",
      description: "确认所有行动入口都指向当前项目的正确页面。",
    },
    {
      title: "审查 Storybook",
      description: "上线前先检查组件状态和长文案展示。",
    },
  ],
  primary: { label: "查看流程", href: "/how-it-works" },
  secondary: { label: "联系团队", href: "/contact" },
} satisfies StarterBoundaryContent;
