/**
 * 集中测试 Mock 消息
 *
 * 此文件提供统一的测试消息源,按命名空间组织,减少重复定义和维护成本。
 * 消息内容基于物理消息包合成结果提取。
 *
 * @usage
 * ```typescript
 * // 导入全部消息
 * import { combinedMessages } from '@/test/constants/mock-messages';
 *
 * // 在测试中使用
 * renderWithIntl(<Component />, 'en', combinedMessages);
 * ```
 *
 * @see docs/test-mock-inventory.md - 完整盘点报告
 */

/**
 * Common 命名空间 - 通用消息
 * 包含常见的 UI 动作、状态文本
 */
const commonMessages = {
  loading: "Loading...",
  error: "An error occurred",
  success: "Success",
  cancel: "Cancel",
  confirm: "Confirm",
  save: "Save",
  edit: "Edit",
  delete: "Delete",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  next: "Next",
  previous: "Previous",
  close: "Close",
  open: "Open",
  toast: {
    form: {
      contact: {
        success: "Message sent successfully!",
        successDescription:
          "Thank you for your message. We'll get back to you soon.",
        error: "Failed to send message",
        errorDescription: "Please try again later or contact us directly.",
        loading: "Sending message...",
      },
      feedback: {
        success: "Feedback submitted!",
        successDescription: "Thank you for your valuable feedback.",
        error: "Failed to submit feedback",
        errorDescription: "Please try again later.",
        loading: "Submitting feedback...",
      },
    },
  },
} as const;

/**
 * Navigation 命名空间 - 导航相关消息
 * 包含主导航、移动导航的所有链接文本和描述
 */
const navigationMessages = {
  home: "Home",
  about: "About",
  contact: "Contact",
  contactSales: "Request a Quote",
  oemWholesale: "OEM & Wholesale",
  siteName: "Tucsenberg",
  siteDescription: "Factory-direct flood barrier supplier for B2B buyers.",
  services: "Services",
  products: "Products",
  solutions: "Solutions",
  resources: "Resources",
  enterprise: "Enterprise",
  docs: "Docs",
  pricing: "Pricing",
  blog: "Blog",
  login: "Login",
  logout: "Logout",
  profile: "Profile",
  settings: "Settings",
  frameworks: "Frameworks",
  infrastructure: "Infrastructure",
  security: "Security",
  aiApps: "AI Apps",
  webApps: "Web Apps",
  ecommerce: "Ecommerce",
  guides: "Guides",
  frameworksDescription: "Build with the best frameworks",
  infrastructureDescription: "Scalable and reliable infrastructure",
  securityDescription: "Enterprise-grade security",
  aiAppsDescription: "Deploy AI applications at scale",
  webAppsDescription: "Modern web application platform",
  ecommerceDescription: "Power your online store",
  docsDescription: "Complete documentation and guides",
  guidesDescription: "Step-by-step tutorials",
  blogDescription: "Latest updates and insights",
  menu: "Menu",
  close: "Close",
} as const;

/**
 * Accessibility 命名空间 - 无障碍访问消息
 * 用于屏幕阅读器、键盘导航等无障碍功能
 */
const accessibilityMessages = {
  skipToContent: "Skip to main content",
  openMenu: "Open navigation menu",
  closeMenu: "Close navigation menu",
  loading: "Content is loading",
  error: "An error has occurred",
  languageSelector: "Select language",
  themeSelector: "Select theme",
  securityVerificationUnavailable:
    "Security verification is temporarily unavailable.",
  turnstileDevBypass: "Dev mode: Turnstile verification bypassed",
  turnstileTestMode: "Bot protection disabled in test mode",
  turnstileLoadFailed:
    "Security verification could not load. Please try again.",
} as const;

/**
 * Theme 命名空间 - 主题切换相关消息
 * 包含主题选择器、主题模式文本
 */
const themeMessages = {
  toggle: "Toggle theme",
  toggleLabel: "Theme toggle",
  light: "Light",
  dark: "Dark",
  system: "System",
  selectTheme: "Select display theme",
  selectDisplayTheme: "Select a display theme:",
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  switchToSystem: "Switch to system theme",
} as const;

/**
 * ErrorBoundary 命名空间 - 错误边界组件消息
 * 用于全局错误处理组件
 */
const errorBoundaryMessages = {
  title: "An error occurred",
  description: "Something went wrong. Please try refreshing the page.",
  tryAgain: "Try Again",
} as const;

/**
 * SEO 命名空间 - SEO 相关元数据
 * 用于测试 metadata 生成和 SEO 组件
 */
const seoMessages = {
  title: "Tucsenberg",
  description:
    "Factory-direct flood barriers from China for flood control projects and wholesale supply.",
  siteName: "Tucsenberg",
  pages: {
    home: {
      title: "Tucsenberg - Factory-Direct Flood Barriers from China",
      description:
        "Compare Tucsenberg flood barrier product lines and request a prepared quote.",
    },
    about: {
      title: "About Tucsenberg",
      description:
        "Learn how Tucsenberg supplies flood barrier products from China.",
    },
    contact: {
      title: "Contact Tucsenberg",
      description:
        "Use the RFQ path or contact Tucsenberg for flood barrier product inquiries.",
    },
    products: {
      title: "Flood Barrier Product Lines",
      description:
        "Review ABS, aluminum, FRP, absorbent, and tube-dam flood barrier options.",
    },
    blog: {
      title: "Guides - Tucsenberg",
      description:
        "Flood barrier material and specification guides for buyers.",
    },
  },
} as const;

/**
 * Footer 命名空间 - 页脚相关消息
 * 包含页脚导航、社交链接等
 */
const footerMessages = {
  sections: {
    product: {
      title: "Product",
      home: "Home",
      enterprise: "Enterprise",
      pricing: "Pricing",
    },
    company: {
      title: "Company",
      terms: "Terms",
      aiPolicy: "AI Policy",
      privacy: "Privacy",
    },
    resources: {
      title: "Resources",
      faqs: "FAQs",
      docs: "Docs",
      ambassadors: "Ambassadors",
      community: "Community",
      platform: "Platform",
    },
    social: {
      title: "Social",
    },
  },
  platform: {
    products: {
      title: "Products",
      ai: "AI",
      enterprise: "Enterprise",
      fluidCompute: "Fluid Compute",
      nextjs: "Next.js",
      observability: "Observability",
      previews: "Previews",
      rendering: "Rendering",
      security: "Security",
      turbo: "Turbo",
      domains: "Domains",
      v0: "v0",
    },
    resources: {
      title: "Resources",
      community: "Community",
      docs: "Docs",
      guides: "Guides",
      academy: "Academy",
      help: "Help",
      integrations: "Integrations",
      pricing: "Pricing",
      resources: "Resources",
      solutionPartners: "Solution Partners",
      startups: "Startups",
      templates: "Templates",
      sdks: "SDKs",
    },
    company: {
      title: "Company",
      about: "About",
      blog: "Blog",
      careers: "Careers",
      changelog: "Changelog",
      contact: "Contact",
      customers: "Customers",
      events: "Events",
      partners: "Partners",
      shipped: "Shipped",
      privacy: "Privacy Policy",
      legal: "Legal",
    },
    social: {
      title: "Social",
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter",
      youtube: "YouTube",
    },
  },
} as const;

/**
 * Under Construction 命名空间 - 施工中页面消息
 * 用于测试未完成页面的占位组件
 */
const underConstructionMessages = {
  title: "Under Construction",
  subtitle: "We're working hard to bring you something amazing",
  description:
    "This page is currently under development. We're building something great and will have it ready soon.",
  backToHome: "Back to Home",
  comingSoon: "Coming Soon",
  expectedCompletion: "Expected completion: {date}",
  expectedLaunch: "Expected launch: {date}",
  stayTuned: "Stay tuned for updates",
  contactUs: "Contact us for more information",
  pages: {
    contact: {
      title: "Contact",
      description:
        "Fastest route: the RFQ form asks the questions we would ask anyway.",
      features: "Prepare application, opening size, quantity, and timeline",
    },
  },
} as const;

/**
 * 合并所有命名空间的完整消息对象
 * 默认导出供 renderWithIntl 等工具使用
 */
export const combinedMessages = {
  common: commonMessages,
  navigation: navigationMessages,
  accessibility: accessibilityMessages,
  theme: themeMessages,
  errorBoundary: errorBoundaryMessages,
  seo: seoMessages,
  footer: footerMessages,
  underConstruction: underConstructionMessages,
} as const;
