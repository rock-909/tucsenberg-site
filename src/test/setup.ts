/**
 * Vitest 测试环境设置文件
 * 配置全局测试环境、Mock和工具函数（按职责拆分）
 */

import "@testing-library/jest-dom/vitest";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

import "./setup.console";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- vitest module augmentation requires empty interface extending matcher type
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- vitest module augmentation requires empty interface extending matcher type
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<
    any,
    void
  > {}
}

import "./setup.base-mocks";
import "./setup.fetch";
import "./setup.next";
import "./setup.icons";
import "./setup.zod";
import "./setup.constants-and-i18n";
import "./setup.env";
import "./setup.browser-apis";
import "./setup.hooks";

export {
  triggerAll,
  triggerVisible,
  setIntersectionAutoVisibleAll,
} from "./setup.intersection-observer";
