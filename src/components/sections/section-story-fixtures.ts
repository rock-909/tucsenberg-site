import type { HomeConfirmSectionViewProps } from "@/components/sections/home-confirm-section-view";
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

export const sectionStoryHomeConfirm = {
  overline: "BEFORE YOU ORDER",
  title: "What we help you confirm",
  body: "We resolve replacement membrane requests against a documented compatibility review, not a brand-name guess.",
  points: [
    {
      key: "compatibility",
      title: "OEM fit against your part number",
      body: "You send the diffuser part number or OEM model; we match it to the membrane variant the compatibility record already covers, or tell you it needs dimensional verification.",
    },
    {
      key: "material",
      title: "Material chosen for your wastewater",
      body: "EPDM and TPU are scoped to the influent your basin actually sees, so the elastomer decision follows operating conditions rather than a catalog default.",
    },
    {
      key: "fit",
      title: "Open questions surfaced before the quote",
      body: "If a dimension or fastening detail is unresolved, we flag it in the compatibility review so it is settled before you commit to an order.",
    },
  ],
} satisfies HomeConfirmSectionViewProps;

export const sectionStoryHomeConfirmChinese = {
  overline: "下单之前",
  title: "我们帮您确认什么",
  body: "我们依据有据可查的兼容性核对来处理替换膜片需求，而不是凭品牌名称猜测。",
  points: [
    {
      key: "compatibility",
      title: "按您的零件号核对 OEM 适配",
      body: "您提供曝气器零件号或 OEM 型号，我们将其对应到兼容性记录已覆盖的膜片型号，或告知您需要进行尺寸验证。",
    },
    {
      key: "material",
      title: "按您的废水工况选择材质",
      body: "EPDM 与 TPU 依据您池体实际进水工况界定，因此弹性体的取舍取决于运行工况，而非目录默认值。",
    },
    {
      key: "fit",
      title: "报价前先暴露待确认问题",
      body: "若某项尺寸或固定方式细节尚未确定，我们会在兼容性核对中标注，以便在您下单前先行解决。",
    },
  ],
} satisfies HomeConfirmSectionViewProps;
