import type { HomeConfirmSectionViewProps } from "@/components/sections/home-confirm-section-view";
import type { HomeMembraneTypeSectionViewProps } from "@/components/sections/home-membrane-type-section-view";
import type { HomeRisksSectionViewProps } from "@/components/sections/home-risks-section-view";
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

export const sectionStoryHomeMembraneType = {
  overline: "FIND BY MEMBRANE TYPE",
  title: "Start from the membrane format you run",
  cta: "See compatibility detail",
  cards: [
    {
      key: "disc",
      name: "Disc membranes",
      body: "Fine-bubble disc diffusers on retainer rings — match the disc diameter and fastening to the compatibility record.",
      href: "/membranes/9-inch-epdm-disc-replacement",
    },
    {
      key: "tube",
      name: "Tube membranes",
      body: "Tube diffusers on a perforated core — match the tube length and end-fitting to the compatibility record.",
      href: "/membranes/62-mm-epdm-tube-replacement",
    },
  ],
} satisfies HomeMembraneTypeSectionViewProps;

export const sectionStoryHomeMembraneTypeChinese = {
  overline: "按膜片类型查找",
  title: "从您所运行的膜片形式入手",
  cta: "查看兼容性详情",
  cards: [
    {
      key: "disc",
      name: "盘式膜片",
      body: "装在固定环上的细气泡盘式曝气器——请将盘径和固定方式对应到兼容性记录。",
      href: "/membranes/9-inch-epdm-disc-replacement",
    },
    {
      key: "tube",
      name: "管式膜片",
      body: "装在穿孔芯管上的管式曝气器——请将管长和端部接头对应到兼容性记录。",
      href: "/membranes/62-mm-epdm-tube-replacement",
    },
  ],
} satisfies HomeMembraneTypeSectionViewProps;

export const sectionStoryHomeRisks = {
  overline: "WHY THIS PAGE EXISTS",
  title: "The four risks buyers avoid",
  body: "Replacement membrane orders go wrong in a small number of repeatable ways. Each section of this page is built to close one of them.",
  items: [
    {
      key: "wrongFit",
      title: "Ordering a part that does not seat",
      body: "A membrane that is close but not dimensionally matched to the diffuser body leaks or unseats; the compatibility review checks fit before the order, not after.",
    },
    {
      key: "wrongMaterial",
      title: "Running an elastomer the influent attacks",
      body: "Where the basin sees BTEX, solvents, oil, or grease loading, an EPDM membrane chosen by default can swell or harden; the material decision follows the documented influent instead.",
    },
    {
      key: "blindOrder",
      title: "Quoting from a guessed cross-reference",
      body: "A brand-name lookup with no recorded basis produces a number nobody can defend; here every match is tied to the compatibility record it came from.",
    },
    {
      key: "shutdownSlip",
      title: "Losing the basin window to a slow reply",
      body: "When a line is down, an unanswered RFQ is the real cost; the SLA commitments set when a review and a quote come back.",
    },
  ],
} satisfies HomeRisksSectionViewProps;

export const sectionStoryHomeRisksChinese = {
  overline: "本页面存在的原因",
  title: "买家要规避的四类风险",
  body: "替换膜片订单出错的方式屈指可数且会重复出现。本页面的每个部分都用于堵住其中一项。",
  items: [
    {
      key: "wrongFit",
      title: "订到无法贴合就位的零件",
      body: "与曝气器本体尺寸接近但未精确匹配的膜片会渗漏或脱位；兼容性核对在下单前而非下单后检查贴合。",
    },
    {
      key: "wrongMaterial",
      title: "在进水会侵蚀的工况下使用错误弹性体",
      body: "当池体存在 BTEX、溶剂、油类或油脂负荷时，按默认选用的 EPDM 膜片可能溶胀或硬化；材质取舍改为依据有据可查的进水工况。",
    },
    {
      key: "blindOrder",
      title: "凭猜测的交叉对照报价",
      body: "无记录依据的品牌名称检索得出的是无人能站得住脚的型号；这里每一处匹配都关联到其来源的兼容性记录。",
    },
    {
      key: "shutdownSlip",
      title: "因回复迟缓错失池体检修窗口",
      body: "当生产线停机时，未回复的询价才是真实成本；SLA 承诺界定核对与报价何时返回。",
    },
  ],
} satisfies HomeRisksSectionViewProps;
