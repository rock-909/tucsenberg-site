# Mock配置标准化指南

## 🎯 统一Mock配置模式

### 核心原则

1. **使用vi.hoisted确保Mock在模块导入前设置**
2. **统一Mock函数命名规范**
3. **确保Mock函数在测试中被使用**
4. **提供完整的Mock实现**

### 标准Mock配置模板

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 1. 使用vi.hoisted确保Mock在模块导入前设置
const { 
  mockFunction1, 
  mockFunction2, 
  mockModule1Method 
} = vi.hoisted(() => ({
  mockFunction1: vi.fn(),
  mockFunction2: vi.fn(),
  mockModule1Method: vi.fn(),
}));

// 2. Mock外部模块
vi.mock('external-module', () => ({
  function1: mockFunction1,
  function2: mockFunction2,
}));

vi.mock('@/lib/module1', () => ({
  method1: mockModule1Method,
}));

// 3. Mock浏览器API（如果需要）
const mockBrowserAPI = {
  observe: vi.fn(),
  disconnect: vi.fn(),
};

Object.defineProperty(global, 'BrowserAPI', {
  value: vi.fn(() => mockBrowserAPI),
  writable: true,
});

// 4. 导入被测试的模块（在Mock之后）
import { functionUnderTest } from '../module-under-test';

describe('Module Under Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置Mock的默认行为
    mockFunction1.mockReturnValue('default-value');
    mockFunction2.mockResolvedValue({ data: 'test' });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('functionUnderTest', () => {
    it('should work correctly', () => {
      // 测试实现
      const result = functionUnderTest();
      
      // 验证Mock被调用
      expect(mockFunction1).toHaveBeenCalledWith(/* expected args */);
      expect(result).toBe(/* expected result */);
    });
  });
});
```

## 🔧 Mock配置分类

### 1. 外部库Mock

```typescript
// Next.js相关
const { mockUseRouter, mockUsePathname } = vi.hoisted(() => ({
  mockUseRouter: vi.fn(),
  mockUsePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  usePathname: mockUsePathname,
}));

// next-intl
const { mockUseTranslations, mockGetTranslations } = vi.hoisted(() => ({
  mockUseTranslations: vi.fn(),
  mockGetTranslations: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: mockGetTranslations,
}));
```

### 2. 内部模块Mock

```typescript
const { mockLogger, mockUtilFunction } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  mockUtilFunction: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@/lib/utils', () => ({
  utilFunction: mockUtilFunction,
}));
```

### 3. 浏览器API Mock

```typescript
// 在vi.hoisted外部定义浏览器API Mock
const mockMatchMedia = vi.fn();
const mockResizeObserver = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  value: mockMatchMedia,
  writable: true,
});

Object.defineProperty(global, 'ResizeObserver', {
  value: mockResizeObserver,
  writable: true,
});
```

## 📋 需要修复的文件清单

### 高优先级（立即修复）
1. `src/lib/__tests__/enhanced-web-vitals.test.ts` - 复杂Mock配置
2. `src/hooks/__tests__/use-enhanced-theme.test.ts` - 浏览器API Mock
3. `src/hooks/__tests__/use-breakpoint.test.ts` - 多个浏览器API Mock

### 中优先级（短期修复）
4. `src/lib/__tests__/navigation.test.ts` - 简单Mock配置
5. `src/lib/__tests__/locale-detection.test.ts` - 浏览器API Mock

### 低优先级（长期优化）
7. 其他测试文件的Mock配置统一
8. 建立Mock配置检查脚本

## 🎯 修复策略

### 第一步：修复高优先级文件
- 将直接Mock转换为vi.hoisted模式
- 确保Mock函数被正确使用
- 添加完整的Mock实现

### 第二步：建立检查机制
- 创建ESLint规则检查Mock配置
- 添加测试脚本验证Mock一致性

### 第三步：文档化标准
- 更新测试指南
- 提供Mock配置示例
