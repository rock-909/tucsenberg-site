import type { HeroSectionContent } from "@/components/sections/hero-section-view";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";
import { TB_BW_HEIGHT_RANGE } from "@/constants/tucsenberg-product-spec-values";

const boxwallDiagramLabels =
  ABS_FLOOD_BARRIERS_PRODUCT_PAGE.diagram?.kind === "boxwall"
    ? ABS_FLOOD_BARRIERS_PRODUCT_PAGE.diagram.labels
    : {
        waterSide: "water side",
        loadSealsBase: "load seals the base",
        profile: "interlocking ABS unit — freestanding L-profile",
        load: "LOAD",
        floodSide: "FLOOD SIDE",
        drySide: "DRY SIDE",
        heightRange: TB_BW_HEIGHT_RANGE.label,
      };

// Storybook 用的样例内容，作用是看排版，不是站点真实文案的副本。上线的首页
// hero 文案在 `messages/profiles/catalog/en/messages.json`，由
// `tests/architecture/tucsenberg-site-contract.test.ts` 逐字钉住；这里写的东西
// 改了不影响买家看到的页面，所以别把它当真值来引用。
//
// 原来这份写的是通用启动器时代的占位文案，眉题直接是那套模板的名字，正文让人
// "等真实公司接手后再替换"。那些字符串是别人的品牌，留在 `src/` 里会让
// "启动器痕迹已经清干净"这句话不成立，所以换成这个站自己的话。这里刻意不复述
// 原文：架构测试扫的是源码文本，注释里抄一遍等于把它又种回去。
export const homepageStoryHero = {
  eyebrow: "Factory-direct flood barriers",
  title: "Five flood barrier product lines from one coordinated factory pool.",
  subtitle:
    "ABS boxwall, aluminum flood gates, absorbent flood bags, tube dams, and FRP planks — one QC standard, OEM and private label available.",
  primaryCta: { label: "View product lines", href: "/products" },
  secondaryCta: { label: "Request a quote", href: "/request-quote" },
  proofAriaLabel: "Homepage proof categories",
  proofItems: [
    { value: "5", label: "product lines" },
    { value: "OEM", label: "and private label" },
    { value: "1", label: "QC standard" },
    { value: "12h", label: "reply window" },
  ],
  diagram: {
    kind: "boxwall",
    labels: boxwallDiagramLabels,
    panelLabel: "PRODUCT PRINCIPLE",
    ariaLabel: "ABS boxwall working-principle line drawing",
    caption:
      "Interlocking ABS units; water load seals the base against the ground.",
  },
} satisfies HeroSectionContent;

// 长文案档位，专门用来看 hero 在长句子下会不会把 CTA 行、预览卡或证明条挤坏。
export const homepageStoryHeroLongCopy = {
  ...homepageStoryHero,
  title:
    "Five flood barrier product lines from one coordinated factory pool, covering doorway openings, loading bays, underground ramps, and temporary perimeter defence on a single QC standard.",
  subtitle:
    "This long-copy story checks whether the hero can handle real-world descriptions without crushing the CTA row, preview card, or proof strip on narrower screens.",
} satisfies HeroSectionContent;

// CJK 排版档位。这不是一个语言档位：站点只出英文，`tucsenberg-site-contract.test.ts`
// 还在断言 zh 的内容目录和消息包都不存在。这里要看的是纯排版问题——中日韩字形是
// 等宽全角、几乎没有词间空格，换行点跟英文完全不同，所以同样的字数会把 h1 撑成
// 不同的行数，四格 proof 条里的短标签也更容易顶破格子。`.claude/rules/ui.md`
// 要求「长中文内容存在溢出或折行风险时」保留这类 story，就是为了这个。
//
// 上一版这份写的是启动器时代的中文占位文案，并且挂在已退役的 zh 语言名下。文案
// 换成本站自己的话，档位本身留着：排版风险跟出不出中文站无关。
export const homepageStoryHeroCjkTypography = {
  ...homepageStoryHero,
  eyebrow: "工厂直供防洪挡板",
  title: "五条防洪挡板产品线，同一个协同工厂池统一出货。",
  subtitle:
    "ABS 拼装箱式挡板、铝合金防洪闸门、吸水式防洪袋、充水充气围堰、玻璃钢复合挡板板材，同一套质检标准，支持 OEM 与自有品牌贴牌。",
  primaryCta: { label: "查看产品线", href: "/products" },
  secondaryCta: { label: "获取报价", href: "/request-quote" },
  proofAriaLabel: "首页要点分类",
  proofItems: [
    { value: "5", label: "条产品线" },
    { value: "OEM", label: "与自有品牌贴牌" },
    { value: "1", label: "套质检标准" },
    { value: "12h", label: "回复时限" },
  ],
  diagram: {
    ...homepageStoryHero.diagram,
    panelLabel: "产品原理",
    ariaLabel: "ABS 箱式挡板工作原理线稿图",
    caption: "ABS 单元互锁成墙；洪水自身重量把底部压向地面形成密封。",
  },
} satisfies HeroSectionContent;
