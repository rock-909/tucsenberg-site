/**
 * Mock翻译数据模块
 * 用于替代JSON文件Mock，解决Vite对JSON文件的特殊处理问题
 */

// 完整的英文翻译数据
export const mockEnTranslations = {
  common: {
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    hello: "Hello",
    goodbye: "Goodbye",
    welcome: "Welcome to {name}",
  },
  navigation: {
    home: "Home",
    about: "About",
    contact: "Contact",
    services: "Services",
    products: "Products",
    blog: "Blog",
  },
  forms: {
    submit: "Submit",
    cancel: "Cancel",
  },
  pages: {
    home: {
      hero: {
        title: "Welcome",
        subtitle: "Get started",
      },
    },
  },
};

// 完整的中文翻译数据
export const mockZhComplete = {
  common: {
    loading: "加载中...",
    error: "发生错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    edit: "编辑",
    delete: "删除",
    hello: "你好",
    goodbye: "再见",
    welcome: "欢迎来到{name}",
  },
  navigation: {
    home: "首页",
    about: "关于",
    contact: "联系",
    services: "服务",
    products: "产品",
    blog: "博客",
  },
  forms: {
    submit: "提交",
    cancel: "取消",
  },
  pages: {
    home: {
      hero: {
        title: "欢迎",
        subtitle: "开始使用",
      },
    },
  },
};

// 不完整的中文翻译数据（缺少contact键和pages.home.hero.subtitle）
export const mockZhIncomplete = {
  common: {
    loading: "加载中...",
    error: "发生错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    edit: "编辑",
    delete: "删除",
    hello: "你好",
    goodbye: "再见",
    welcome: "欢迎来到{name}",
  },
  navigation: {
    home: "首页",
    about: "关于",
    // Missing 'contact' key to test validation
    services: "服务",
    products: "产品",
    blog: "博客",
  },
  forms: {
    submit: "提交",
    cancel: "取消",
  },
  // Missing pages.home.hero.subtitle
};

// 包含空值的翻译数据
export const mockZhEmpty = {
  common: {
    hello: "", // Empty value for testing
    goodbye: "再见",
    welcome: "欢迎来到{name}",
    loading: "加载中...",
    error: "发生错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    edit: "编辑",
    delete: "删除",
  },
  navigation: {
    home: "首页",
    about: "关于",
    contact: "联系我们",
    services: "服务",
    products: "产品",
    blog: "博客",
  },
  forms: {
    submit: "提交",
    cancel: "取消",
  },
};

// 占位符不匹配的翻译数据
export const mockZhWithPlaceholderMismatch = {
  common: {
    hello: "你好",
    goodbye: "再见",
    welcome: "欢迎来到{company}", // Different placeholder than English
    loading: "加载中...",
    error: "发生错误",
    success: "成功",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    edit: "编辑",
    delete: "删除",
  },
  navigation: {
    home: "首页",
    about: "关于",
    contact: "联系我们",
    services: "服务",
    products: "产品",
    blog: "博客",
  },
  forms: {
    submit: "提交",
    cancel: "取消",
  },
};

// 不完整的日文翻译数据
export const mockJaIncomplete = {
  common: {
    hello: "こんにちは",
    // Missing other keys
  },
};

// 动态Mock配置
export let currentMockConfig = {
  en: mockEnTranslations,
  zh: mockZhIncomplete, // 默认使用不完整的中文翻译
  ja: mockJaIncomplete,
};

// 设置Mock配置的函数
export const setMockConfig = (config: Partial<Record<string, unknown>>) => {
  currentMockConfig = { ...currentMockConfig, ...config };
};

// 重置为默认配置
export const resetMockConfig = () => {
  currentMockConfig = {
    en: mockEnTranslations,
    zh: mockZhIncomplete,
    ja: mockJaIncomplete,
  };
};

// 获取指定语言的Mock翻译数据
export const getMockTranslation = (locale: string) => {
  const translation =
    currentMockConfig[locale as keyof typeof currentMockConfig];
  if (translation === undefined) {
    // 如果语言不在配置中，返回undefined而不是空对象
    // 这将触发i18n-validation.ts中的文件缺失错误处理
    return undefined;
  }
  return translation;
};
