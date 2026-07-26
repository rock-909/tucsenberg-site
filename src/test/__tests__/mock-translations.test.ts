import { describe, expect, it } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { getFlatMessages } from "@/test/i18n-messages";
import { createMockTranslations } from "@/test/utils";

/**
 * mock 翻译的契约：它必须和生产 next-intl 的取值语义一致，否则拿它写的断言
 * 证明的是测试环境独有的行为。上一版没有这份契约测试，于是"值是空字符串就
 * 回退成 key 名"这个 bug 一路活到审查才被发现。
 */

describe("createMockTranslations 的取值语义", () => {
  it("真实 key 返回真实文案", () => {
    const t = createMockTranslations();
    const real = getComposedMessages("en") as { navigation: { home: string } };

    expect(t("navigation.home")).toBe(real.navigation.home);
    expect(t("navigation.home")).not.toBe("navigation.home");
  });

  // 消息包里确实有内容就是空字符串的条目（社交链接留空）。生产 next-intl
  // 返回空串，mock 也必须返回空串，不能因为空串是 falsy 就翻成 key 名。
  it("值是空字符串的真实 key 返回空字符串，不返回 key 名", () => {
    const messages = getFlatMessages();
    const emptyKeys = [...messages]
      .filter(([, value]) => value === "")
      .map(([key]) => key);
    const t = createMockTranslations();

    expect(emptyKeys.length).toBeGreaterThan(0);
    for (const key of emptyKeys) {
      expect(t(key)).toBe("");
    }
  });

  it("不存在的 key 回退成 key 本身", () => {
    const t = createMockTranslations();

    expect(t("navigation.thisKeyDoesNotExist")).toBe(
      "navigation.thisKeyDoesNotExist",
    );
  });

  it("覆写真实 key 生效", () => {
    const t = createMockTranslations({ "navigation.home": "改过的" });

    expect(t("navigation.home")).toBe("改过的");
  });

  // 允许覆写不存在的 key，等于让测试自己发明文案——正是这个分支清掉的问题。
  it("覆写不存在的 key 直接报错", () => {
    expect(() =>
      createMockTranslations({ "navigation.notARealKey": "看着挺像" }),
    ).toThrow(/navigation.notARealKey/u);
  });
});
