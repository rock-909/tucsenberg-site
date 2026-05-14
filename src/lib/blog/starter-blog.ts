import type { Locale } from "@/config/paths/types";

interface StarterBlogSection {
  heading: string;
  body: string;
}

export interface StarterBlogArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  sections: readonly StarterBlogSection[];
}

const EN_ARTICLES = [
  {
    slug: "prepare-before-launch",
    title: "What to prepare before launching your first showcase website",
    description:
      "A practical checklist for brand facts, page content, images, contact details, and deployment ownership.",
    publishedAt: "2026-05-05",
    readingTime: "4 min read",
    sections: [
      {
        heading: "Start with confirmed facts",
        body: "Before design polish, confirm the company name, domain, contact email, phone, legal body, and the basic offer you need to present.",
      },
      {
        heading: "Prepare real content assets",
        body: "A starter can provide structure, but it cannot invent real product photos, team proof, customer references, or legal commitments.",
      },
      {
        heading: "Decide the inquiry path",
        body: "Choose where form submissions go, who replies, what response time is realistic, and what details visitors should provide.",
      },
      {
        heading: "Prove deployment separately",
        body: "A local build is not a launch proof. Use preview deployment, form canary checks, analytics access, and owner signoff before going public.",
      },
    ],
  },
  {
    slug: "showcase-site-pages",
    title: "A showcase site is more than a homepage",
    description:
      "The minimum public site needs a clear home, product or service explanation, contact path, trust boundary, and legal basics.",
    publishedAt: "2026-05-05",
    readingTime: "3 min read",
    sections: [
      {
        heading: "Home explains the path",
        body: "The homepage should help visitors understand the problem, the answer, the core capabilities, and the next action.",
      },
      {
        heading: "Products explain what people get",
        body: "A product page should group capabilities by outcome first, then add technical proof where it helps trust.",
      },
      {
        heading: "About explains identity and boundaries",
        body: "For a starter demo, the about page should be honest about what this is, who it fits, and what must be replaced.",
      },
      {
        heading: "Contact completes the path",
        body: "The contact page is the quick conversion route. It should say what to expect and make the next step easy.",
      },
    ],
  },
  {
    slug: "why-cloudflare",
    title: "Why Cloudflare is the recommended deployment path",
    description:
      "Cloudflare keeps the starter close to the deployment path it is designed to prove, while optional compatibility can stay secondary.",
    publishedAt: "2026-05-05",
    readingTime: "3 min read",
    sections: [
      {
        heading: "Use one default deployment truth",
        body: "A starter should have one recommended deployment path. For this project, Cloudflare is the default path and other platforms are compatibility options.",
      },
      {
        heading: "Keep preview proof separate",
        body: "Preview deployment proves more than local build output. It checks routing, assets, runtime assumptions, and form behavior closer to production.",
      },
      {
        heading: "Make analytics owner-visible",
        body: "Traffic reporting is part of launch readiness because owners need to see whether the site is actually receiving visitors.",
      },
      {
        heading: "Keep compatibility honest",
        body: "Optional platform compatibility should be documented as optional, not mixed into the default launch promise.",
      },
    ],
  },
  {
    slug: "replace-the-starter",
    title:
      "What must be replaced before using this starter for a real business",
    description:
      "The demo is intentionally polished, but real launch still requires replacing identity, products, legal copy, proof assets, and integrations.",
    publishedAt: "2026-05-05",
    readingTime: "4 min read",
    sections: [
      {
        heading: "Replace identity first",
        body: "Company name, domain, email, phone, address, social links, and legal entity should be confirmed before public launch.",
      },
      {
        heading: "Replace the offer story",
        body: "Product and service examples are only placeholders. A real project needs the actual offer, proof, photos, and constraints.",
      },
      {
        heading: "Replace operational destinations",
        body: "Forms, analytics, email delivery, Turnstile, and Cloudflare settings must point to real owner-controlled accounts.",
      },
      {
        heading: "Keep launch proof separate",
        body: "The starter provides guardrails. It does not replace owner review, legal review, traffic checks, or final canary testing.",
      },
    ],
  },
] as const satisfies readonly StarterBlogArticle[];

const ZH_ARTICLES = [
  {
    slug: "prepare-before-launch",
    title: "第一个展示型网站上线前要准备什么",
    description:
      "从品牌事实、页面内容、图片资产、联系信息到部署归属，一次整理清楚。",
    publishedAt: "2026-05-05",
    readingTime: "4 分钟阅读",
    sections: [
      {
        heading: "先确认真实事实",
        body: "设计细节之前，先确认公司名、域名、联系邮箱、电话、法务主体，以及网站要表达的基础业务。",
      },
      {
        heading: "准备真实内容资产",
        body: "starter 能提供结构，但不能替你创造真实产品照片、团队证明、客户案例或法务承诺。",
      },
      {
        heading: "决定询盘路径",
        body: "表单提交到哪里、谁回复、多久回复、访客需要提供哪些信息，都需要在上线前定下来。",
      },
      {
        heading: "部署证明单独做",
        body: "本地构建成功不等于上线就绪。预览部署、表单 canary、流量可见性和负责人确认要分开证明。",
      },
    ],
  },
  {
    slug: "showcase-site-pages",
    title: "展示型网站不只是一个首页",
    description:
      "最小可公开网站需要清楚的首页、产品或服务说明、联系路径、信任边界和基础法务页。",
    publishedAt: "2026-05-05",
    readingTime: "3 分钟阅读",
    sections: [
      {
        heading: "首页说明路径",
        body: "首页应该让访客快速理解痛点、答案、核心能力和下一步行动。",
      },
      {
        heading: "产品页说明结果",
        body: "产品页应先按业务结果组织能力，再用技术证明补足可信度。",
      },
      {
        heading: "关于页说明身份和边界",
        body: "starter demo 的关于页要诚实说明它是什么、适合谁，以及哪些内容必须替换。",
      },
      {
        heading: "联系页完成转化",
        body: "联系页是快速转化路径，要说明访客提交后会发生什么，并降低下一步门槛。",
      },
    ],
  },
  {
    slug: "why-cloudflare",
    title: "为什么 Cloudflare 是推荐部署路径",
    description:
      "Cloudflare 更贴近这个 starter 要证明的默认上线路径，其他平台兼容可以保留为可选项。",
    publishedAt: "2026-05-05",
    readingTime: "3 分钟阅读",
    sections: [
      {
        heading: "默认部署路径只能有一个",
        body: "starter 应该有一个明确推荐路径。本项目默认是 Cloudflare，其他平台只作为兼容选项。",
      },
      {
        heading: "预览证明要单独看",
        body: "预览部署比本地构建更接近生产环境，能检查路由、资源、运行时假设和表单行为。",
      },
      {
        heading: "流量要让负责人看得见",
        body: "流量面板属于上线准备，因为负责人需要知道网站公开后到底有没有真实访问。",
      },
      {
        heading: "兼容承诺要诚实",
        body: "可选平台兼容应该写清楚是 optional，不要混进默认上线承诺里。",
      },
    ],
  },
  {
    slug: "replace-the-starter",
    title: "真实业务使用前必须替换哪些内容",
    description:
      "demo 可以做得完整，但正式上线前仍然要替换身份、产品、法务、证明资产和集成配置。",
    publishedAt: "2026-05-05",
    readingTime: "4 分钟阅读",
    sections: [
      {
        heading: "先替换身份",
        body: "公司名、域名、邮箱、电话、地址、社交链接和法务主体，都要在公开上线前确认。",
      },
      {
        heading: "替换业务表达",
        body: "产品和服务示例只是占位。真实项目需要真实业务、证明、图片和约束条件。",
      },
      {
        heading: "替换运营目的地",
        body: "表单、流量分析、邮件发送、Turnstile 和 Cloudflare 配置都必须指向负责人控制的真实账号。",
      },
      {
        heading: "上线证明单独保留",
        body: "starter 提供护栏，但不能替代负责人检查、法务检查、流量检查和最终 canary 测试。",
      },
    ],
  },
] as const satisfies readonly StarterBlogArticle[];

const ARTICLES_BY_LOCALE = {
  en: EN_ARTICLES,
  // Spanish starter blog copy is deferred with the rest of starter content.
  es: EN_ARTICLES,
  zh: ZH_ARTICLES,
} as const satisfies Record<Locale, readonly StarterBlogArticle[]>;

export function getStarterBlogArticles(
  locale: Locale,
): readonly StarterBlogArticle[] {
  return ARTICLES_BY_LOCALE[locale];
}

export function getStarterBlogArticle(
  locale: Locale,
  slug: string,
): StarterBlogArticle {
  const article = getStarterBlogArticles(locale).find(
    (item) => item.slug === slug,
  );

  if (!article) {
    throw new Error(`Unknown starter blog article: ${slug}`);
  }

  return article;
}

export function getStarterBlogArticleSlugs(): string[] {
  return EN_ARTICLES.map((article) => article.slug);
}
